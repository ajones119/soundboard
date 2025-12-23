import { useDroppable } from "@dnd-kit/core"
import { ScrollArea } from "../ui/scroll-area"
import type { Sound } from "@/api/sounds"
import LibrarySoundItem from "./components/LibrarySoundItem"
import type { ReactNode } from 'react'

const MasterListDropZone = ({ children }: { children: ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'master-list-drop-zone',
    data: {
      type: 'drop-zone',
      accepts: ['saved-sound'],
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

type SoundLibraryProps = {
  sounds: Sound[]
}

const SoundLibrary = ({ sounds }: SoundLibraryProps) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h2 className="text-xl font-semibold mb-4">Sound Library</h2>
      <MasterListDropZone>
        <ScrollArea className="h-full w-full">
          <div className="pt-4 pb-4">
            {sounds.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {sounds.map((sound) => (
                  <LibrarySoundItem key={sound.id} sound={sound} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-lg font-medium mb-2">No sounds found</div>
                <div className="text-sm text-muted-foreground">
                  Add sounds to your database to get started
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </MasterListDropZone>
    </div>
  )
}

export default SoundLibrary

