# Adding Haptic Feedback to Soundboard

This guide explains how to add haptic feedback (vibration) when playing sounds on mobile devices.

## Overview

Haptic feedback provides tactile response when users interact with sounds, enhancing the user experience on mobile devices. This uses the [Web Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

## Browser Support

- ✅ **Android Chrome/Edge**: Full support
- ✅ **Samsung Internet**: Full support
- ⚠️ **iOS Safari**: Limited support (requires user gesture)
- ❌ **Desktop browsers**: No support (API exists but no vibration hardware)

## Basic Implementation

### 1. Check for Vibration Support

```typescript
// Check if vibration API is available
const isVibrationSupported = () => {
  return 'vibrate' in navigator
}
```

### 2. Simple Vibration Pattern

```typescript
// Single vibration (100ms)
navigator.vibrate(100)

// Pattern: vibrate, pause, vibrate
navigator.vibrate([100, 50, 100])

// Stop vibration
navigator.vibrate(0)
```

## Integration with Sound Playback

### Option 1: Simple Tap Feedback

Add a short vibration when play button is pressed:

```typescript
// In SoundGridItem.tsx
const handleToggle = () => {
  // Haptic feedback on play
  if (!isPlaying && isVibrationSupported()) {
    navigator.vibrate(10) // Short tap feedback
  }
  
  // ... rest of play logic
}
```

### Option 2: Pattern-Based Feedback

Different vibration patterns for play vs pause:

```typescript
const handleToggle = () => {
  if (!isVibrationSupported()) return
  
  if (isPlaying) {
    // Pause: single short pulse
    navigator.vibrate(20)
  } else {
    // Play: double pulse
    navigator.vibrate([10, 30, 10])
  }
  
  // ... rest of toggle logic
}
```

### Option 3: Intensity-Based Feedback

Vary vibration intensity based on sound characteristics:

```typescript
const handlePlay = (sound: Sound) => {
  if (isVibrationSupported()) {
    // Longer sounds get longer vibration
    const duration = sound.duration || 0
    const vibrationDuration = Math.min(duration > 1000 ? 50 : 20, 100)
    navigator.vibrate(vibrationDuration)
  }
  
  // ... play logic
}
```

## Complete Implementation Example

### Create Haptic Utility

```typescript
// src/lib/haptic.ts

export const HapticFeedback = {
  /**
   * Check if vibration API is supported
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator
  },

  /**
   * Simple tap feedback (10-20ms)
   */
  tap(intensity: 'light' | 'medium' | 'strong' = 'medium'): void {
    if (!this.isSupported()) return
    
    const durations = {
      light: 5,
      medium: 10,
      strong: 20
    }
    
    navigator.vibrate(durations[intensity])
  },

  /**
   * Double tap pattern
   */
  doubleTap(): void {
    if (!this.isSupported()) return
    navigator.vibrate([10, 30, 10])
  },

  /**
   * Success pattern (play sound)
   */
  play(): void {
    if (!this.isSupported()) return
    navigator.vibrate([10, 20, 10])
  },

  /**
   * Stop pattern (pause sound)
   */
  pause(): void {
    if (!this.isSupported()) return
    navigator.vibrate(20)
  },

  /**
   * Error pattern
   */
  error(): void {
    if (!this.isSupported()) return
    navigator.vibrate([50, 50, 50])
  },

  /**
   * Stop all vibration
   */
  stop(): void {
    if (!this.isSupported()) return
    navigator.vibrate(0)
  }
}
```

### Use in SoundGridItem

```typescript
// src/components/SoundGridItem.tsx
import { HapticFeedback } from '@/lib/haptic'

const handleToggle = () => {
  if (isPlaying) {
    HapticFeedback.pause()
    // ... pause logic
  } else {
    HapticFeedback.play()
    // ... play logic
  }
}
```

## Best Practices

### 1. Keep Vibrations Short
- **Tap feedback**: 5-20ms
- **Action feedback**: 20-50ms
- **Error feedback**: 50-100ms
- Avoid long vibrations (>200ms) - they're annoying

### 2. Respect User Preferences
```typescript
// Check if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!prefersReducedMotion && HapticFeedback.isSupported()) {
  HapticFeedback.tap()
}
```

### 3. Only on User Interaction
- Only vibrate on direct user actions (button clicks)
- Don't vibrate on automatic events (sound ending, etc.)
- iOS requires user gesture for vibration

### 4. Graceful Degradation
- Always check `isSupported()` before calling
- App should work perfectly without haptics
- Haptics are enhancement, not requirement

## Advanced Patterns

### Rhythm-Based Feedback

For music/rhythmic sounds, sync vibration with beat:

```typescript
// Sync vibration with audio playback
const syncVibration = (audio: HTMLAudioElement, bpm: number) => {
  const interval = (60 / bpm) * 1000 // ms per beat
  
  const vibrateInterval = setInterval(() => {
    if (audio.paused) {
      clearInterval(vibrateInterval)
      return
    }
    navigator.vibrate(10) // Light pulse on beat
  }, interval)
  
  // Cleanup on pause/end
  audio.addEventListener('pause', () => clearInterval(vibrateInterval))
  audio.addEventListener('ended', () => clearInterval(vibrateInterval))
}
```

### Intensity Based on Volume

```typescript
const vibrateWithVolume = (volume: number) => {
  // Volume is 0-100, map to 5-30ms vibration
  const intensity = Math.floor((volume / 100) * 25) + 5
  navigator.vibrate(intensity)
}
```

## Testing

### Desktop Testing
- Use Chrome DevTools → Sensors → Device orientation
- Or test on actual mobile device

### Mobile Testing
1. Test on Android device (best support)
2. Test on iOS device (limited support)
3. Test with reduced motion preference enabled
4. Test with vibration disabled in system settings

## Troubleshooting

### Vibration Not Working

1. **Check support**: `'vibrate' in navigator`
2. **Check user gesture**: iOS requires direct user interaction
3. **Check device settings**: User may have disabled vibration
4. **Check browser**: Some browsers don't support it

### Too Strong/Weak

- Adjust duration values (5-50ms range)
- Test on different devices (varies by hardware)
- Consider user preference setting

## Accessibility

- Always provide visual feedback alongside haptic
- Don't rely solely on haptics for important information
- Respect `prefers-reduced-motion` setting
- Make haptics optional (user setting)

## Example: User Preference Toggle

```typescript
// src/lib/haptic.ts
let hapticsEnabled = true

export const HapticFeedback = {
  // ... existing methods ...
  
  setEnabled(enabled: boolean): void {
    hapticsEnabled = enabled
  },
  
  isEnabled(): boolean {
    return hapticsEnabled && this.isSupported()
  },
  
  // Update all methods to check isEnabled()
  tap(intensity: 'light' | 'medium' | 'strong' = 'medium'): void {
    if (!this.isEnabled()) return
    // ... rest of implementation
  }
}
```

## Resources

- [MDN: Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Can I Use: Vibration API](https://caniuse.com/vibration)
- [Web.dev: Haptic Feedback](https://web.dev/haptics/)

