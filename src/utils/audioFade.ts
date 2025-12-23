// Fade duration constant (1/5 second = 200ms)
export const FADE_DURATION_MS = 200

/**
 * Fades in an audio element from 0 to its target volume
 */
export const fadeIn = async (audio: HTMLAudioElement, targetVolume: number): Promise<void> => {
  const startVolume = 0
  const endVolume = targetVolume
  const duration = FADE_DURATION_MS
  const startTime = Date.now()

  return new Promise((resolve) => {
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Linear fade
      const currentVolume = startVolume + (endVolume - startVolume) * progress
      audio.volume = currentVolume
      
      if (progress >= 1) {
        clearInterval(fadeInterval)
        audio.volume = endVolume
        resolve()
      }
    }, 10) // Update every 10ms for smooth fade
  })
}

/**
 * Fades out an audio element from its current volume to 0
 */
export const fadeOut = async (audio: HTMLAudioElement): Promise<void> => {
  const startVolume = audio.volume
  const endVolume = 0
  const duration = FADE_DURATION_MS
  const startTime = Date.now()

  return new Promise((resolve) => {
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Linear fade
      const currentVolume = startVolume + (endVolume - startVolume) * progress
      audio.volume = currentVolume
      
      if (progress >= 1) {
        clearInterval(fadeInterval)
        audio.volume = endVolume
        resolve()
      }
    }, 10) // Update every 10ms for smooth fade
  })
}

