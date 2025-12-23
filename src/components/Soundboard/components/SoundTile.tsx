import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, GripVertical, Volume2, Repeat } from 'lucide-react'
import { useSavedSounds } from '@/context/SavedSoundsContext'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { categoryColors, categoryIcons, defaultCategoryStyle, typeColors, typeIcons, defaultTypeStyle } from '@/utils/categoryMaps'
import { fadeIn, fadeOut } from '@/utils/audioFade'

type SoundGridItemProps = {
  soundId: string
}

const SoundGridItem = ({ soundId }: SoundGridItemProps) => {
    const { attributes, listeners, setNodeRef, transition, transform } = useSortable({ 
      id: soundId,
      data: {
        type: 'saved-sound',
        soundId: soundId,
      }
    })
  const [isPlaying, setIsPlaying] = useState(false)
  const { savedSoundsMap, setSoundVolume, setSoundLoop, masterVolume } = useSavedSounds()

  const sound = savedSoundsMap.get(soundId)
  
  // Local state for slider - syncs with sound.volume but doesn't cause context rerenders
  const [sliderVolume, setSliderVolume] = useState(sound?.volume ?? 100)
  // Local state for loop - syncs with sound.audio.loop but doesn't cause context rerenders
  const [isLooping, setIsLooping] = useState(sound?.audio?.loop ?? false)

  useEffect(() => {
    if (!sound?.audio) return

    // Sync slider with sound volume (when sound changes externally)
    setSliderVolume(sound.volume ?? 100)
    // Sync loop state with audio element
    setIsLooping(sound.audio.loop ?? false)

    // Add event listener for when audio ends
    const handleEnded = () => {
      setIsPlaying(false)
    }

    sound.audio.addEventListener('ended', handleEnded)

    // Check initial playing state
    setIsPlaying(!sound.audio.paused)

    // Cleanup
    return () => {
      sound.audio.removeEventListener('ended', handleEnded)
    }
  }, [sound])

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setSliderVolume(newVolume) // Update local state immediately (no rerender of other components)
    if (sound?.audio && setSoundVolume) {
      setSoundVolume(soundId, newVolume) // Update context (no state change = no rerender)
    }
  }

  const handleToggleLoop = () => {
    const newLoopState = !isLooping
    setIsLooping(newLoopState) // Update local state immediately
    if (sound?.audio && setSoundLoop) {
      setSoundLoop(soundId, newLoopState) // Update context (no state change = no rerender)
    }
  }

  if (!sound) return null

  const category = sound.category || ''
  const CategoryIcon = category ? categoryIcons[category.toLowerCase()] : null
  const categoryStyle = category ? categoryColors[category.toLowerCase()] : defaultCategoryStyle

  const type = sound.type || ''
  const TypeIcon = type ? typeIcons[type.toLowerCase()] : null
  const typeStyle = type ? typeColors[type.toLowerCase()] : defaultTypeStyle

  const handleToggle = async () => {
    if (!sound.audio) return

    if (sound.audio.paused) {
      try {
        // Fade in on play - calculate target volume with master volume applied
        const baseVolume = sound.volume ?? 100
        const targetVolume = (baseVolume / 100) * (masterVolume / 100)
        sound.audio.volume = 0
        await sound.audio.play()
        await fadeIn(sound.audio, targetVolume)
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      }
    } else {
      // Fade out on pause
      await fadeOut(sound.audio)
      sound.audio.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div 
      className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg bg-card hover:bg-accent transition-colors relative cursor-grab active:cursor-grabbing" 
      ref={setNodeRef} 
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
    >
      <div
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground z-10"
      >
        <GripVertical className="size-4" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleToggle}
          aria-label={isPlaying ? `Pause ${sound.name}` : `Play ${sound.name}`}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <Button
          variant={isLooping ? "default" : "outline"}
          size="icon"
          onClick={handleToggleLoop}
          aria-label={isLooping ? `Disable loop for ${sound.name}` : `Enable loop for ${sound.name}`}
        >
          <Repeat className="size-4" />
        </Button>
      </div>
      <div className="w-full flex items-center gap-2">
        <Volume2 className="size-3 text-muted-foreground" />
        <Slider
          value={[sliderVolume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={100}
          step={5}
          className="flex-1"
        />
      </div>
      <p className="text-sm font-medium text-center truncate w-full">
        {sound.name}
      </p>
      <div className="flex items-center gap-2 w-full">
        {type && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${typeStyle}`}>
            {TypeIcon && <TypeIcon className="size-3" />}
            <span className="capitalize">{type}</span>
          </div>
        )}
        {category && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${categoryStyle}`}>
            {CategoryIcon && <CategoryIcon className="size-3" />}
            <span className="capitalize">{category}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SoundGridItem