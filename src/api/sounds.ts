import { queryClient, supabase } from './utils'
import { useQuery } from '@tanstack/react-query'

export interface Sound {
  id: string,
  name: string,
  url: string,
  category?: string, // Defaults to empty string
  type?: string, // 'music', 'ambiance', or 'effect', defaults to empty string
}

export interface SavedSound extends Sound {
  audio: HTMLAudioElement
  volume?: number // 0-100, defaults to 100
}
//needed to ensure that we keep the same audio element for the same sound throughout the app and through tanstack query cache changes
const audioElementRegistry = new Map<string, HTMLAudioElement>();

// Helper function to get or create audio element
const getOrCreateAudioElement = (soundId: string, url: string): HTMLAudioElement => {
  let audio = audioElementRegistry.get(soundId)
  if (!audio) {
    audio = new Audio(url)
    audioElementRegistry.set(soundId, audio)
  } else if (audio.src !== url) {
    // URL changed, create new one
    audio.pause()
    audio = new Audio(url)
    audioElementRegistry.set(soundId, audio)
  }
  return audio
}

export const useSounds = () => {
  return useQuery({
    queryKey: ['sounds'],
    queryFn: async (): Promise<Sound[]> => {
      const { data, error } = await supabase
        .from('Soundboard_Sounds')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      
      // Type coercion - ensure required fields exist
      return (data || []).map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        url: String(item.url ?? ''),
        category: String(item.category ?? ''),
        type: String(item.type ?? '')
      }))
    }
  })
}

export const useSoundsByIds = (ids: string[]) => {
  const sortedIds = [...ids].sort((a, b) => a.localeCompare(b))
  return useQuery({
    queryKey: ['savedSounds', sortedIds],
    queryFn: async (): Promise<Map<string, SavedSound>> => {
      if (ids.length === 0) return new Map<string, SavedSound>()
      
      const { data, error } = await supabase
        .from('Soundboard_Sounds')
        .select('*')
        .in('id', sortedIds)
      
      if (error) throw error
      
      // Map results and maintain order based on ids array
      const soundMap = new Map(
        (data || []).map((item) => {
          const soundId = String(item.id ?? '')
          const url = String(item.url ?? '')
          // Reuse existing audio element if it exists
          const audio = getOrCreateAudioElement(soundId, url)
          
          return [
            soundId,
            {
              id: soundId,
              name: String(item.name ?? ''),
              url: url,
              category: String(item.category ?? ''),
              type: String(item.type ?? ''),
              audio: audio, // Reused audio element
              volume: 100
            }
          ]
        })
      )
      
      // Return sounds in the order of the ids array
      return soundMap;
    },
    enabled: ids.length > 0
  })
}

// optimistically updates the cached map to avoid refetching that specific sound on the saved sounds page
export const addSoundToCachedMap = (sound: Sound, currentIds: string[], metadata?: { volume?: number; loop?: boolean }) => {
  const client = queryClient
  
  const newIds = [...currentIds, sound.id]
  const newSortedIds = [...newIds].sort((a, b) => a.localeCompare(b))
  
  const currentSortedIds = [...currentIds].sort((a, b) => a.localeCompare(b))
  const currentMap = client.getQueryData<Map<string, SavedSound>>(['savedSounds', currentSortedIds]) || new Map<string, SavedSound>()
  
  const newMap = new Map(currentMap)
  
  // Check if sound already exists in current map (preserve audio element)
  const existingSound = currentMap.get(sound.id)
  let audio: HTMLAudioElement
  let volume: number
  let loop: boolean
  
  if (existingSound) {
    // Reuse existing audio element
    audio = existingSound.audio
    volume = metadata?.volume ?? existingSound.volume ?? 100
    loop = metadata?.loop ?? existingSound.audio.loop ?? false
  } else {
    // Create new audio element using registry
    audio = getOrCreateAudioElement(sound.id, sound.url)
    volume = metadata?.volume ?? 100
    loop = metadata?.loop ?? false
  }
  
  audio.volume = volume / 100 // Convert 0-100 to 0-1
  audio.loop = loop
  
  newMap.set(sound.id, {
    id: sound.id,
    name: sound.name,
    url: sound.url,
    category: sound.category ?? '',
    type: sound.type ?? '',
    audio: audio, // Preserved or reused audio element
    volume: volume
  })
  
  client.setQueryData(['savedSounds', newSortedIds], newMap)
  
  if (currentIds.length > 0) {
    client.setQueryData(['savedSounds', currentSortedIds], newMap)
  }
}

// optimistically removes a sound from the cached map to avoid refetching
export const removeSoundFromCachedMap = (soundId: string, currentIds: string[]) => {
  const client = queryClient
  
  // Pause and clean up audio element if it exists
  const audio = audioElementRegistry.get(soundId)
  if (audio) {
    audio.pause()
    // Keep in registry for potential reuse (don't delete)
    // If you want to fully clean up, uncomment: audioElementRegistry.delete(soundId)
  }
  
  const newIds = currentIds.filter(id => id !== soundId)
  const newSortedIds = [...newIds].sort((a, b) => a.localeCompare(b))
  
  const currentSortedIds = [...currentIds].sort((a, b) => a.localeCompare(b))
  const currentMap = client.getQueryData<Map<string, SavedSound>>(['savedSounds', currentSortedIds]) || new Map<string, SavedSound>()
  
  const newMap = new Map(currentMap)
  newMap.delete(soundId)
  
  // Update cache with new sorted IDs
  client.setQueryData(['savedSounds', newSortedIds], newMap)
  
  // Also update the old cache entry if it exists (for smooth transition)
  if (currentIds.length > 0) {
    client.setQueryData(['savedSounds', currentSortedIds], newMap)
  }
}