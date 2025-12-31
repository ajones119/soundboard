import { useState, useEffect, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, GripVertical, Volume2, Repeat } from 'lucide-react'
import type { Sound } from '@/api/sounds'
import { useSavedSounds } from '@/context/SavedSoundsContext'
import { categoryColors, categoryIcons, defaultCategoryStyle, typeColors, typeIcons, defaultTypeStyle } from '@/utils/categoryMaps'
import { fadeIn, fadeOut } from '@/utils/audioFade'

type LibrarySoundItemProps = {
  sound: Sound
}

const LibrarySoundItem = ({ sound }: LibrarySoundItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isLooping, setIsLooping] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { savedSoundIds, masterVolume } = useSavedSounds()
  
  const isSaved = savedSoundIds.includes(sound.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `library-${sound.id}`,
    data: {
      type: 'library-sound',
      sound,
      soundId: sound.id,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Sync loop state with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping
    }
  }, [isLooping])

  // Update volume when master volume changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      const targetVolume = (volume / 100) * (masterVolume / 100)
      audioRef.current.volume = targetVolume
    }
  }, [masterVolume, volume, isPlaying])

  const handleToggle = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(sound.url)
      audioRef.current.volume = 0 // Start at 0 for fade in
      audioRef.current.loop = isLooping
      audioRef.current.addEventListener('ended', () => {
        if (!audioRef.current?.loop) {
          setIsPlaying(false)
        }
      })
    } else {
      // Update loop if it changed
      audioRef.current.loop = isLooping
    }

    if (isPlaying) {
      // Fade out on pause
      await fadeOut(audioRef.current)
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        // Fade in on play - apply master volume
        const targetVolume = (volume / 100) * (masterVolume / 100)
        await audioRef.current.play()
        await fadeIn(audioRef.current, targetVolume)
        setIsPlaying(true)
      } catch (error) {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      }
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current && isPlaying) {
      // Apply master volume when setting individual volume
      const targetVolume = (newVolume / 100) * (masterVolume / 100)
      audioRef.current.volume = targetVolume
    }
  }

  const handleToggleLoop = () => {
    setIsLooping(!isLooping)
  }

  const category = sound.category || ''
  const CategoryIcon = category ? categoryIcons[category.toLowerCase()] : null
  const categoryStyle = category ? categoryColors[category.toLowerCase()] : defaultCategoryStyle

  const type = sound.type || ''
  const TypeIcon = type ? typeIcons[type.toLowerCase()] : null
  const typeStyle = type ? typeColors[type.toLowerCase()] : defaultTypeStyle

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 border rounded-lg bg-card hover:bg-accent transition-colors relative cursor-grab active:cursor-grabbing"
    >
      <div
        {...attributes}
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
          value={[volume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={100}
          step={5}
          className="flex-1"
        />
      </div>
      <p className="text-xs sm:text-sm font-medium text-center truncate w-full px-1">
        {sound.name}
      </p>
      <div className="flex items-center gap-1 sm:gap-2 w-full flex-wrap justify-center">
        {type && (
          <div className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs border ${typeStyle}`}>
            {TypeIcon && <TypeIcon className="size-2.5 sm:size-3" />}
            <span className="capitalize">{type}</span>
          </div>
        )}
        {category && (
          <div className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs border ${categoryStyle}`}>
            {CategoryIcon && <CategoryIcon className="size-2.5 sm:size-3" />}
            <span className="capitalize">{category}</span>
          </div>
        )}
      </div>
      {isSaved && (
        <div className="absolute top-2 right-2 size-2 bg-green-500 rounded-full" />
      )}
    </div>
  )
}

export default LibrarySoundItem

