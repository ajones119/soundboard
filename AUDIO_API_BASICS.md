# JavaScript Audio API Basics

This guide covers the fundamentals of using the HTML5 Audio API in JavaScript for the soundboard application.

## Table of Contents

- [Creating Audio Elements](#creating-audio-elements)
- [Playback Control](#playback-control)
- [Volume Control](#volume-control)
- [Looping](#looping)
- [Resetting Audio](#resetting-audio)
- [Extracting Audio Data](#extracting-audio-data)
- [Event Handling](#event-handling)
- [Best Practices](#best-practices)

## Creating Audio Elements

### Method 1: Constructor (Recommended)

```typescript
// Create new Audio element
const audio = new Audio('/path/to/sound.mp3')

// Set source after creation
const audio = new Audio()
audio.src = '/path/to/sound.mp3'
```

### Method 2: HTML Audio Element

```typescript
// Create via DOM
const audio = document.createElement('audio')
audio.src = '/path/to/sound.mp3'
```

### Method 3: Query Existing Element

```typescript
// Get existing audio element
const audio = document.querySelector('audio') as HTMLAudioElement
```

## Playback Control

### Play

```typescript
const audio = new Audio('/sound.mp3')

// Play returns a Promise
audio.play()
  .then(() => {
    console.log('Audio started playing')
  })
  .catch((error) => {
    console.error('Error playing audio:', error)
    // Common errors:
    // - User hasn't interacted with page (autoplay blocked)
    // - Network error loading file
    // - Invalid audio format
  })
```

**Important**: Modern browsers require user interaction before allowing audio playback. Always call `play()` in response to a user action (click, touch, etc.).

### Pause

```typescript
// Pause playback (maintains current position)
audio.pause()

// Check if paused
if (audio.paused) {
  console.log('Audio is paused')
}
```

### Stop (Pause + Reset)

```typescript
// Stop and reset to beginning
audio.pause()
audio.currentTime = 0
```

## Volume Control

### Setting Volume

```typescript
// Volume is a number between 0.0 and 1.0
audio.volume = 0.5  // 50% volume
audio.volume = 1.0  // 100% volume (max)
audio.volume = 0.0  // Muted (but not the same as muted property)
audio.volume = 1.5  // ❌ Invalid (clamped to 1.0)
```

### Getting Current Volume

```typescript
const currentVolume = audio.volume
console.log(`Volume: ${currentVolume * 100}%`)
```

### Mute/Unmute

```typescript
// Mute (volume stays the same, just muted)
audio.muted = true

// Unmute
audio.muted = false

// Check if muted
if (audio.muted) {
  console.log('Audio is muted')
}
```

### Volume Helper Function

```typescript
// Convert 0-100 scale to 0-1 scale
const setVolumePercent = (audio: HTMLAudioElement, percent: number) => {
  audio.volume = Math.max(0, Math.min(1, percent / 100))
}

// Usage
setVolumePercent(audio, 75) // 75% volume
```

## Looping

### Enable Loop

```typescript
// Loop indefinitely
audio.loop = true

// Check if looping
if (audio.loop) {
  console.log('Audio will loop')
}
```

### Loop Specific Number of Times

```typescript
let loopCount = 0
const maxLoops = 3

audio.addEventListener('ended', () => {
  if (loopCount < maxLoops) {
    loopCount++
    audio.currentTime = 0
    audio.play()
  }
})
```

### Loop with Fade

```typescript
audio.loop = true

audio.addEventListener('timeupdate', () => {
  const fadeTime = 2 // seconds before end to start fading
  const duration = audio.duration
  const currentTime = audio.currentTime
  
  if (duration - currentTime < fadeTime) {
    // Fade out
    const fadeProgress = (duration - currentTime) / fadeTime
    audio.volume = fadeProgress
  } else {
    // Fade in
    audio.volume = 1.0
  }
})
```

## Resetting Audio

### Reset to Beginning

```typescript
// Reset playback position to start
audio.currentTime = 0

// Reset and pause
audio.pause()
audio.currentTime = 0
```

### Reset Volume

```typescript
// Reset to default volume
audio.volume = 1.0
audio.muted = false
```

### Complete Reset

```typescript
const resetAudio = (audio: HTMLAudioElement) => {
  audio.pause()
  audio.currentTime = 0
  audio.volume = 1.0
  audio.muted = false
  audio.loop = false
}
```

### Reload Audio

```typescript
// Reload audio from source (useful after error)
audio.load()
```

## Extracting Audio Data

### Basic Properties

```typescript
const audio = new Audio('/sound.mp3')

// Duration (in seconds) - NaN until metadata loaded
console.log('Duration:', audio.duration)

// Current playback position (in seconds)
console.log('Current time:', audio.currentTime)

// Playback state
console.log('Paused:', audio.paused)
console.log('Ended:', audio.ended)
console.log('Ready state:', audio.readyState)

// Source URL
console.log('Source:', audio.src)

// Volume
console.log('Volume:', audio.volume)
console.log('Muted:', audio.muted)
```

### Ready State Values

```typescript
// audio.readyState possible values:
const HAVE_NOTHING = 0  // No information available
const HAVE_METADATA = 1 // Metadata loaded (duration, dimensions)
const HAVE_CURRENT_DATA = 2 // Data for current position available
const HAVE_FUTURE_DATA = 3 // Data for current and future positions
const HAVE_ENOUGH_DATA = 4 // Enough data to play through

if (audio.readyState >= HAVE_METADATA) {
  console.log('Duration:', audio.duration)
}
```

### Getting Duration

```typescript
// Wait for metadata to load
audio.addEventListener('loadedmetadata', () => {
  console.log('Duration:', audio.duration, 'seconds')
  console.log('Duration:', formatTime(audio.duration))
})

// Format duration helper
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
```

### Getting Current Progress

```typescript
// Progress as percentage (0-100)
const getProgress = (audio: HTMLAudioElement): number => {
  if (!audio.duration) return 0
  return (audio.currentTime / audio.duration) * 100
}

// Usage
audio.addEventListener('timeupdate', () => {
  const progress = getProgress(audio)
  console.log(`Progress: ${progress.toFixed(1)}%`)
})
```

### Getting Remaining Time

```typescript
const getRemainingTime = (audio: HTMLAudioElement): number => {
  if (!audio.duration) return 0
  return audio.duration - audio.currentTime
}

audio.addEventListener('timeupdate', () => {
  const remaining = getRemainingTime(audio)
  console.log(`${remaining.toFixed(1)}s remaining`)
})
```

### Audio Format Information

```typescript
// Check if audio can play specific format
const canPlayMP3 = audio.canPlayType('audio/mpeg') !== ''
const canPlayWAV = audio.canPlayType('audio/wav') !== ''
const canPlayOGG = audio.canPlayType('audio/ogg') !== ''

console.log('MP3 support:', canPlayMP3 ? 'Yes' : 'No')
```

## Event Handling

### Common Events

```typescript
const audio = new Audio('/sound.mp3')

// Metadata loaded (duration, etc.)
audio.addEventListener('loadedmetadata', () => {
  console.log('Metadata loaded, duration:', audio.duration)
})

// Audio can start playing
audio.addEventListener('canplay', () => {
  console.log('Audio ready to play')
})

// Audio can play through without stopping
audio.addEventListener('canplaythrough', () => {
  console.log('Audio fully loaded')
})

// Playback started
audio.addEventListener('play', () => {
  console.log('Audio started playing')
})

// Playback paused
audio.addEventListener('pause', () => {
  console.log('Audio paused')
})

// Playback ended
audio.addEventListener('ended', () => {
  console.log('Audio finished')
  // Reset if needed
  audio.currentTime = 0
})

// Time update (fires during playback)
audio.addEventListener('timeupdate', () => {
  console.log('Current time:', audio.currentTime)
})

// Volume changed
audio.addEventListener('volumechange', () => {
  console.log('Volume changed:', audio.volume)
})

// Error occurred
audio.addEventListener('error', (e) => {
  console.error('Audio error:', e)
  const error = audio.error
  if (error) {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        console.error('Aborted')
        break
      case MediaError.MEDIA_ERR_NETWORK:
        console.error('Network error')
        break
      case MediaError.MEDIA_ERR_DECODE:
        console.error('Decode error')
        break
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        console.error('Format not supported')
        break
    }
  }
})

// Loading progress
audio.addEventListener('progress', () => {
  if (audio.buffered.length > 0) {
    const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
    const duration = audio.duration
    const bufferedPercent = (bufferedEnd / duration) * 100
    console.log(`Buffered: ${bufferedPercent.toFixed(1)}%`)
  }
})
```

### Remove Event Listeners

```typescript
const handlePlay = () => console.log('Playing')

audio.addEventListener('play', handlePlay)

// Remove listener
audio.removeEventListener('play', handlePlay)
```

## Best Practices

### 1. Lazy Loading

```typescript
// Don't create Audio until needed
let audio: HTMLAudioElement | null = null

const playSound = (url: string) => {
  if (!audio) {
    audio = new Audio(url)
  } else if (audio.src !== url) {
    audio.src = url
  }
  audio.play()
}
```

### 2. Cleanup on Unmount

```typescript
useEffect(() => {
  const audio = new Audio('/sound.mp3')
  
  return () => {
    // Cleanup
    audio.pause()
    audio.src = '' // Release memory
    audio.removeEventListener('play', handlePlay)
  }
}, [])
```

### 3. Error Handling

```typescript
const playAudio = async (audio: HTMLAudioElement) => {
  try {
    await audio.play()
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      console.error('Autoplay blocked - user interaction required')
    } else if (error.name === 'NotSupportedError') {
      console.error('Audio format not supported')
    } else {
      console.error('Playback failed:', error)
    }
  }
}
```

### 4. Preload Strategy

```typescript
// No preload (default) - load on demand
audio.preload = 'none'

// Load metadata only
audio.preload = 'metadata'

// Preload entire file (use sparingly)
audio.preload = 'auto'
```

### 5. Multiple Audio Instances

```typescript
// For playing multiple sounds simultaneously
const audio1 = new Audio('/sound1.mp3')
const audio2 = new Audio('/sound2.mp3')
const audio3 = new Audio('/sound3.mp3')

// All can play at once
audio1.play()
audio2.play()
audio3.play()
```

### 6. Audio Pool Pattern

```typescript
// Reuse Audio elements for better performance
class AudioPool {
  private pool: HTMLAudioElement[] = []
  private maxSize = 10

  getAudio(url: string): HTMLAudioElement {
    let audio = this.pool.find(a => a.paused && a.src === url)
    
    if (!audio && this.pool.length < this.maxSize) {
      audio = new Audio(url)
      this.pool.push(audio)
    } else if (!audio) {
      // Reuse paused audio
      audio = this.pool.find(a => a.paused) || this.pool[0]
      audio.src = url
    }
    
    return audio
  }
}
```

### 7. Volume Normalization

```typescript
// Store original volume before muting
let originalVolume = audio.volume

// Mute
audio.muted = true

// Unmute (restore original)
audio.muted = false
audio.volume = originalVolume
```

## Complete Example

```typescript
class SoundPlayer {
  private audio: HTMLAudioElement | null = null
  private url: string = ''

  constructor(url: string) {
    this.url = url
  }

  async play(): Promise<void> {
    if (!this.audio) {
      this.audio = new Audio(this.url)
      this.setupEventListeners()
    }

    try {
      await this.audio.play()
    } catch (error) {
      console.error('Playback failed:', error)
      throw error
    }
  }

  pause(): void {
    this.audio?.pause()
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  setLoop(loop: boolean): void {
    if (this.audio) {
      this.audio.loop = loop
    }
  }

  getDuration(): number {
    return this.audio?.duration || 0
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  getProgress(): number {
    if (!this.audio || !this.audio.duration) return 0
    return (this.audio.currentTime / this.audio.duration) * 100
  }

  private setupEventListeners(): void {
    if (!this.audio) return

    this.audio.addEventListener('ended', () => {
      console.log('Sound finished')
    })

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
    })
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }
  }
}

// Usage
const player = new SoundPlayer('/sound.mp3')
await player.play()
player.setVolume(0.75)
player.setLoop(true)
```

## Resources

- [MDN: HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
- [MDN: Media Events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (Advanced)

