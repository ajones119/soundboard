import { useSoundsByIds, addSoundToCachedMap, removeSoundFromCachedMap, type SavedSound, type Sound } from '@/api/sounds'
import { queryClient } from '@/api/utils'
import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { fadeOut } from '@/utils/audioFade'

interface SoundMetadata {
  volume?: number
  loop?: boolean
  // Add more metadata fields here in the future
}

interface SavedSoundsStorage {
  savedSounds: string[]
  metadata: {
    [soundId: string]: SoundMetadata
  }
  masterVolume?: number // 0-100, defaults to 100
}

interface SavedSoundsContextType {
  savedSoundIds: string[]
  addSound: (id: string, sound: Sound, index?: number) => void
  removeSound: (id: string) => void
  clearAllSounds: () => void
  pauseAllSounds: () => void
  setSoundVolume: (id: string, volume: number) => void
  setSoundLoop: (id: string, loop: boolean) => void
  setMasterVolume: (volume: number) => void
  masterVolume: number
  reorderSounds: (ids: string[]) => void
  savedSoundsMap: Map<string, SavedSound>
  isLoadingSavedSounds: boolean
}

const SavedSoundsContext = createContext<SavedSoundsContextType | undefined>(undefined)

const STORAGE_KEY = 'soundboard-saved-sounds'

const getStoredSounds = (): SavedSoundsStorage => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SavedSoundsStorage
      // Validate structure
      if (parsed && Array.isArray(parsed.savedSounds)) {
        return {
          savedSounds: parsed.savedSounds.filter((id): id is string => typeof id === 'string'),
          metadata: parsed.metadata && typeof parsed.metadata === 'object' ? parsed.metadata : {},
          masterVolume: typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 100
        }
      }
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error)
  }
  return { savedSounds: [], metadata: {}, masterVolume: 100 }
}

const saveToStorage = (data: SavedSoundsStorage) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function SavedSoundsProvider({ children }: { children: ReactNode }) {
  const [savedSoundIds, setSavedSoundIds] = useState<string[]>(() => {
    return getStoredSounds().savedSounds || []
  })
  const [masterVolume, setMasterVolumeState] = useState<number>(() => {
    return getStoredSounds().masterVolume ?? 100
  })
  
  // Use ref to track metadata - no state updates = no rerenders
  const metadataRef = useRef<{ [soundId: string]: SoundMetadata }>(getStoredSounds().metadata || {})

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = getStoredSounds()
    setSavedSoundIds(stored.savedSounds)
    setMasterVolumeState(stored.masterVolume ?? 100)
    metadataRef.current = stored.metadata || {}
  }, [])

  // Save to localStorage whenever savedSoundIds or masterVolume changes
  useEffect(() => {
    saveToStorage({ savedSounds: savedSoundIds, metadata: metadataRef.current, masterVolume })
  }, [savedSoundIds, masterVolume])

  const addSound = (id: string, sound: Sound, index?: number) => {
    setSavedSoundIds((prev) => {
      // Don't add if already exists
      if (prev.includes(id)) {
        return prev
      }
      
      // Get metadata for this sound (if it exists from previous session)
      const soundMetadata = metadataRef.current[id] || {}
      addSoundToCachedMap(sound, prev, soundMetadata)
      
      // If index is provided, insert at that position
      if (typeof index === 'number' && index >= 0 && index <= prev.length) {
        const newIds = [...prev]
        newIds.splice(index, 0, id)
        return newIds
      }
      
      // Otherwise, append to end
      return [...prev, id]
    })
  }

  const removeSound = (id: string) => {
    setSavedSoundIds((prev) => {
      // Update cache optimistically BEFORE state update
      removeSoundFromCachedMap(id, prev)
      
      return prev.filter((soundId) => soundId !== id)
    })
    
    // Remove metadata for this sound (ref only, no state update)
    delete metadataRef.current[id]
    // Save to localStorage
    saveToStorage({ savedSounds: savedSoundIds.filter(sid => sid !== id), metadata: metadataRef.current })
  }

  const clearAllSounds = () => {
    // loop through all saved sounds and stop them
    savedSoundsMap.forEach((savedSound) => {
      if (savedSound.audio && !savedSound.audio.paused) {
        savedSound.audio.pause()
      }
    })
    setSavedSoundIds([])
    metadataRef.current = {}
    saveToStorage({ savedSounds: [], metadata: {} })
  }

  const reorderSounds = (ids: string[]) => {
    setSavedSoundIds(ids)
  }

  const { data: savedSoundsMapData = new Map<string, SavedSound>(), isLoading: isLoadingSavedSounds } = useSoundsByIds(savedSoundIds)

  // Apply metadata to sounds when they're loaded
  const savedSoundsMap = useMemo(() => {
    const map = new Map(savedSoundsMapData)
    map.forEach((sound, id) => {
      // Preserve the audio element reference (don't recreate)
      // The audio element should already be from the registry
      
      // Use ref for current metadata (avoids rerenders on volume changes)
      const soundMetadata = metadataRef.current[id]
      const baseVolume = soundMetadata?.volume ?? sound.volume ?? 100
      sound.volume = baseVolume
      // Apply master volume multiplier (0-1 range)
      sound.audio.volume = (baseVolume / 100) * (masterVolume / 100)
      
      // Apply loop state from metadata
      if (soundMetadata?.loop !== undefined) {
        sound.audio.loop = soundMetadata.loop
      } else {
        // Default to false if no metadata
        sound.audio.loop = false
      }
    })
    return map
  }, [savedSoundsMapData, masterVolume])

  const pauseAllSounds = async () => {
    const fadePromises = Array.from(savedSoundsMap.values())
      .filter(savedSound => savedSound.audio && !savedSound.audio.paused)
      .map(async (savedSound) => {
        await fadeOut(savedSound.audio)
        savedSound.audio.pause()
      })
    
    await Promise.all(fadePromises)
  }

  const setSoundVolume = (id: string, volume: number) => {
    const sound = savedSoundsMap.get(id)
    if (sound) {
      // Update sound object volume property (for UI to read)
      sound.volume = volume
      
      // Apply master volume multiplier (0-1 range)
      sound.audio.volume = (volume / 100) * (masterVolume / 100)
      
      // Update metadata ref immediately (no rerender)
      metadataRef.current = {
        ...metadataRef.current,
        [id]: {
          ...metadataRef.current[id],
          volume
        }
      }
      
      // Update cached map immediately
      const sortedIds = [...savedSoundIds].sort((a, b) => a.localeCompare(b))
      const currentMap = queryClient.getQueryData<Map<string, SavedSound>>(['savedSounds', sortedIds])
      if (currentMap) {
        const updatedMap = new Map(currentMap)
        const updatedSound = updatedMap.get(id)
        if (updatedSound) {
          updatedSound.volume = volume
          updatedSound.audio.volume = (volume / 100) * (masterVolume / 100)
          updatedMap.set(id, updatedSound)
        }
      }
      
      // Save to localStorage immediately (no state update = no rerender)
      saveToStorage({ savedSounds: savedSoundIds, metadata: metadataRef.current, masterVolume })
    }
  }

  const setMasterVolume = (volume: number) => {
    setMasterVolumeState(volume)
    
    // Apply master volume to all sounds immediately
    savedSoundsMap.forEach((sound) => {
      const baseVolume = sound.volume ?? 100
      sound.audio.volume = (baseVolume / 100) * (volume / 100)
      
      // Update cache
      const sortedIds = [...savedSoundIds].sort((a, b) => a.localeCompare(b))
      const currentMap = queryClient.getQueryData<Map<string, SavedSound>>(['savedSounds', sortedIds])
      if (currentMap) {
        const updatedMap = new Map(currentMap)
        const updatedSound = updatedMap.get(sound.id)
        if (updatedSound) {
          updatedSound.audio.volume = (baseVolume / 100) * (volume / 100)
          updatedMap.set(sound.id, updatedSound)
        }
      }
    })
    
    // Save to localStorage
    saveToStorage({ savedSounds: savedSoundIds, metadata: metadataRef.current, masterVolume: volume })
  }

  const setSoundLoop = (id: string, loop: boolean) => {
    const sound = savedSoundsMap.get(id)
    if (sound) {
      // Update audio element loop immediately
      sound.audio.loop = loop
      
      // Update metadata ref immediately (no rerender)
      metadataRef.current = {
        ...metadataRef.current,
        [id]: {
          ...metadataRef.current[id],
          loop
        }
      }
      
      // Update cached map immediately
      const sortedIds = [...savedSoundIds].sort((a, b) => a.localeCompare(b))
      const currentMap = queryClient.getQueryData<Map<string, SavedSound>>(['savedSounds', sortedIds])
      if (currentMap) {
        const updatedMap = new Map(currentMap)
        const updatedSound = updatedMap.get(id)
        if (updatedSound) {
          updatedSound.audio.loop = loop
          updatedMap.set(id, updatedSound)
        }
      }
      
      // Save to localStorage immediately (no state update = no rerender)
      saveToStorage({ savedSounds: savedSoundIds, metadata: metadataRef.current, masterVolume })
    }
  }
  
  // Update the context type to match
  const contextValue: SavedSoundsContextType = {
    savedSoundIds,
    addSound,
    removeSound,
    clearAllSounds,
    pauseAllSounds,
    setSoundVolume,
    setSoundLoop,
    setMasterVolume,
    masterVolume,
    reorderSounds,
    isLoadingSavedSounds,
    savedSoundsMap,
  }


  return (
    <SavedSoundsContext.Provider value={contextValue}>
      {children}
    </SavedSoundsContext.Provider>
  )
}

export function useSavedSounds() {
  const context = useContext(SavedSoundsContext)
  if (context === undefined) {
    throw new Error('useSavedSounds must be used within a SavedSoundsProvider')
  }
  return context
}

