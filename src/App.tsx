import { useState, useMemo, useEffect } from 'react'
import { useSounds } from '@/api/sounds'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Search, Trash2, Play, GripVertical, Pause, Volume2 } from 'lucide-react'
import { DndContext, type DragEndEvent, type DragStartEvent, closestCenter, DragOverlay } from '@dnd-kit/core'
import type { Sound } from '@/api/sounds'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { useSavedSounds } from '@/context/SavedSoundsContext'
import SoundBoard from '@/components/Soundboard/SoundBoard'
import SoundLibrary from '@/components/SoundLibrary/SoundLibrary'
import { arrayMove } from '@dnd-kit/sortable'
import { categoryColors, categoryIcons, defaultCategoryStyle, typeColors, typeIcons, defaultTypeStyle } from '@/utils/categoryMaps'

// Overlay component for library sounds
const LibrarySoundOverlay = ({ sound }: { sound: Sound }) => {
  const category = sound.category || ''
  const CategoryIcon = category ? categoryIcons[category.toLowerCase()] : null
  const categoryStyle = category ? categoryColors[category.toLowerCase()] : defaultCategoryStyle
  
  const type = sound.type || ''
  const TypeIcon = type ? typeIcons[type.toLowerCase()] : null
  const typeStyle = type ? typeColors[type.toLowerCase()] : defaultTypeStyle
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg bg-card shadow-lg opacity-95 rotate-3 scale-105 overflow-hidden max-w-[200px]">
      <div className="absolute top-2 left-2 text-muted-foreground">
        <GripVertical className="size-4" />
      </div>
      <Button variant="outline" size="icon" disabled>
        <Play className="size-4" />
      </Button>
      <p className="text-sm font-medium text-center truncate w-full px-2">
        {sound.name}
      </p>
      {(type || category) && (
        <div className="flex items-center gap-2 w-full flex-wrap justify-center px-2">
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
      )}
    </div>
  )
}

// Overlay component for saved sounds
const SavedSoundOverlay = ({ sound }: { sound: { id: string; name: string; url: string; category?: string; type?: string } }) => {
  const category = sound.category || ''
  const CategoryIcon = category ? categoryIcons[category.toLowerCase()] : null
  const categoryStyle = category ? categoryColors[category.toLowerCase()] : defaultCategoryStyle
  
  const type = sound.type || ''
  const TypeIcon = type ? typeIcons[type.toLowerCase()] : null
  const typeStyle = type ? typeColors[type.toLowerCase()] : defaultTypeStyle
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg bg-card shadow-lg opacity-95 rotate-3 scale-105 overflow-hidden max-w-[200px]">
      <Button variant="outline" size="icon" disabled>
        <Play className="size-4" />
      </Button>
      <p className="text-sm font-medium text-center truncate w-full px-2">
        {sound.name}
      </p>
      {(type || category) && (
        <div className="flex items-center gap-2 w-full flex-wrap justify-center px-2">
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
      )}
    </div>
  )
}

function App() {
  const { data: sounds, isLoading, error } = useSounds()
  const [searchQuery, setSearchQuery] = useState('')
  const { clearAllSounds, pauseAllSounds, savedSoundIds, addSound, removeSound, reorderSounds, savedSoundsMap, masterVolume, setMasterVolume } = useSavedSounds()
  const [masterVolumeSlider, setMasterVolumeSlider] = useState(masterVolume)

  // Sync master volume slider with context
  useEffect(() => {
    setMasterVolumeSlider(masterVolume)
  }, [masterVolume])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeData, setActiveData] = useState<{ type: string; sound?: Sound; soundId?: string } | null>(null)

  const filteredSounds = useMemo(() => {
    if (!sounds) return []
    if (!searchQuery.trim()) return sounds
    
    const query = searchQuery.toLowerCase().trim()
    return sounds.filter((sound) =>
      sound.name.toLowerCase().includes(query)
    )
  }, [sounds, searchQuery])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(String(active.id))
    setActiveData(active.data.current as { type: string; sound?: Sound; soundId?: string } | null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveData(null)
    
    if (!over) return

    const overIdStr = String(over.id)

    // Check if dragging from library
    const isLibrarySound = active.data.current?.type === 'library-sound'
    const sound = isLibrarySound ? active.data.current?.sound : null

    // Check if dragging from saved sounds
    const isSavedSound = active.data.current?.type === 'saved-sound'
    const savedSoundId = isSavedSound ? active.data.current?.soundId : null

    // Handle dragging from library to saved sounds
    // Check if dropping on the drop zone OR on an existing saved sound item
    if (isLibrarySound && sound) {
      const isDroppingOnZone = overIdStr === 'saved-sounds-drop-zone'
      const isDroppingOnSavedSound = savedSoundIds.includes(overIdStr)
      
      if ((isDroppingOnZone || isDroppingOnSavedSound) && !savedSoundIds.includes(sound.id)) {
        // If dropping on a specific saved sound item, insert before it
        // If dropping on the zone (empty area), append to end
        const insertIndex = isDroppingOnSavedSound 
          ? savedSoundIds.indexOf(overIdStr)
          : undefined
        
        addSound(sound.id, sound, insertIndex)
        return
      }
    }

    // Handle dragging from saved sounds to master list
    if (isSavedSound && savedSoundId && overIdStr === 'master-list-drop-zone') {
      removeSound(savedSoundId)
      return
    }

    // Handle reordering within saved sounds
    if (isSavedSound && savedSoundIds.includes(overIdStr)) {
      const oldIndex = savedSoundIds.indexOf(savedSoundId!)
      const newIndex = savedSoundIds.indexOf(overIdStr)
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(savedSoundIds, oldIndex, newIndex)
        reorderSounds(newOrder)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Loading sounds...</div>
          <div className="text-sm text-muted-foreground">Fetching from Library...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-destructive mb-2">
            Error loading sounds
          </div>
          <div className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Soundboard</h1>
          <div className="flex items-center gap-4">
            {savedSoundIds.length > 0 && (
              <>
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Volume2 className="size-4 text-muted-foreground" />
                  <Slider
                    value={[masterVolumeSlider]}
                    onValueChange={(value) => {
                      const newVolume = value[0]
                      setMasterVolumeSlider(newVolume)
                      setMasterVolume(newVolume)
                    }}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3ch] text-right">
                    {masterVolumeSlider}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pauseAllSounds}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pause className="size-4 mr-2" />
                    Pause All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllSounds}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Clear All Saved Sounds
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sounds by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="h-full w-full mx-auto">
          <DndContext 
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
          {sounds && sounds.length > 0 ? (
            <>
              {filteredSounds.length > 0 ? (
                <ResizablePanelGroup orientation="vertical" className="min-h-[600px]">
                  {/* Top Panel - Saved Sounds */}
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <SoundBoard />
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Bottom Panel - Sound Library */}
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <SoundLibrary sounds={filteredSounds} />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <div className="text-center py-12">
                  <div className="text-lg font-medium mb-2">No sounds match your search</div>
                  <div className="text-sm text-muted-foreground">
                    Try a different search term
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-lg font-medium mb-2">No sounds found</div>
              <div className="text-sm text-muted-foreground">
                Add sounds to your Supabase database to get started
              </div>
            </div>
          )}
          <DragOverlay>
            {activeId && activeData ? (
              activeData.type === 'library-sound' && activeData.sound ? (
                <LibrarySoundOverlay sound={activeData.sound} />
              ) : activeData.type === 'saved-sound' && activeData.soundId ? (
                (() => {
                  const sound = savedSoundsMap.get(activeData.soundId)
                  return sound ? (
                    <SavedSoundOverlay sound={sound} />
                  ) : null
                })()
              ) : null
            ) : null}
          </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}

export default App
