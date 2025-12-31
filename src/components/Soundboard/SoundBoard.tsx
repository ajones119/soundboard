import { useDroppable } from "@dnd-kit/core"
import { ScrollArea } from "../ui/scroll-area"
import { useSavedSounds } from "@/context/SavedSoundsContext"
import { useSoundsByIds } from "@/api/sounds"
import SoundTile from "./components/SoundTile"
import { SortableContext } from "@dnd-kit/sortable"
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { useState, useEffect, useRef } from 'react'

const SavedSoundsDropZone = ({ children }: { children: ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'saved-sounds-drop-zone',
    data: {
      type: 'drop-zone',
      accepts: ['library-sound'],
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`h-full w-full min-h-[200px] ${isOver ? 'bg-accent/50 rounded-lg border-2 border-dashed border-primary' : ''}`}
    >
      {children}
    </div>
  )
}


const SoundBoard = () => {
    const { savedSoundIds } = useSavedSounds()
    const { isLoading: isLoadingSavedSounds } = useSoundsByIds(savedSoundIds);
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const hasLoadedRef = useRef(false)

    // Track when initial load completes
    useEffect(() => {
        if (!isLoadingSavedSounds && !hasLoadedRef.current) {
            hasLoadedRef.current = true
            // After initial load animation completes, disable stagger
            const timer = setTimeout(() => {
                setIsInitialLoad(false)
            }, savedSoundIds.length * 100 + 200) // Wait for all staggered animations + buffer
            return () => clearTimeout(timer)
        }
    }, [isLoadingSavedSounds, savedSoundIds.length])

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Saved Sounds</h2>
            <SavedSoundsDropZone>
                <ScrollArea className="h-full w-full">
                    <div className="pt-2 sm:pt-4 pb-2 sm:pb-4">
                        <SortableContext items={savedSoundIds}>
                            {isLoadingSavedSounds ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading saved sounds...
                                </div>
                            ) : savedSoundIds && savedSoundIds.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {savedSoundIds.map((sound, index) => (
                                            <motion.div
                                                key={sound}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                layout
                                                transition={{ 
                                                    duration: 0.2, 
                                                    ease: "easeOut", 
                                                    delay: isInitialLoad ? index * 0.1 : 0 
                                                }}
                                            >
                                                <SoundTile soundId={sound} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                                    <div className="text-lg font-medium mb-2">No saved sounds</div>
                                    <div className="text-sm text-muted-foreground">
                                        Drag sounds from the library below
                                    </div>
                                </div>
                            )}
                        </SortableContext>
                    </div>
                </ScrollArea>
            </SavedSoundsDropZone>
        </div>
)
}

export default SoundBoard