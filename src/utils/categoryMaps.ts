import { 
  TreePine, 
  Home, 
  Sword, 
  CloudRain, 
  Sparkles, 
  Mountain, 
  Moon, 
  Sun, 
  Smile,
  Music,
  Volume2,
  Ghost,
  Eye,
  Layers,
  type LucideIcon
} from 'lucide-react'

// Category to color mapping - using CSS variables with darkwave aesthetic
export const categoryColors: Record<string, string> = {
  'forest': 'bg-[var(--category-forest)]/20 text-[var(--category-forest)] border-[var(--category-forest)]/30',
  'tavern': 'bg-[var(--category-tavern)]/20 text-[var(--category-tavern)] border-[var(--category-tavern)]/30',
  'battle': 'bg-[var(--category-battle)]/20 text-[var(--category-battle)] border-[var(--category-battle)]/30',
  'weather': 'bg-[var(--category-weather)]/20 text-[var(--category-weather)] border-[var(--category-weather)]/30',
  'magic': 'bg-[var(--category-magic)]/20 text-[var(--category-magic)] border-[var(--category-magic)]/30',
  'mountain': 'bg-[var(--category-mountain)]/20 text-[var(--category-mountain)] border-[var(--category-mountain)]/30',
  'night': 'bg-[var(--category-night)]/20 text-[var(--category-night)] border-[var(--category-night)]/30',
  'day': 'bg-[var(--category-day)]/20 text-[var(--category-day)] border-[var(--category-day)]/30',
  'funny': 'bg-[var(--category-funny)]/20 text-[var(--category-funny)] border-[var(--category-funny)]/30',
  'horror': 'bg-[var(--category-horror)]/20 text-[var(--category-horror)] border-[var(--category-horror)]/30',
  'intrigue': 'bg-[var(--category-intrigue)]/20 text-[var(--category-intrigue)] border-[var(--category-intrigue)]/30',
  'underdark': 'bg-[var(--category-underdark)]/20 text-[var(--category-underdark)] border-[var(--category-underdark)]/30',
}

// Category to icon mapping
export const categoryIcons: Record<string, LucideIcon> = {
  'forest': TreePine,
  'tavern': Home,
  'battle': Sword,
  'weather': CloudRain,
  'magic': Sparkles,
  'mountain': Mountain,
  'night': Moon,
  'day': Sun,
  'funny': Smile,
  'horror': Ghost,
  'intrigue': Eye,
  'underdark': Layers,
}

// Type to color mapping - using CSS variables with darkwave aesthetic
export const typeColors: Record<string, string> = {
  'music': 'bg-[var(--type-music)]/20 text-[var(--type-music)] border-[var(--type-music)]/30',
  'ambiance': 'bg-[var(--type-ambiance)]/20 text-[var(--type-ambiance)] border-[var(--type-ambiance)]/30',
  'effect': 'bg-[var(--type-effect)]/20 text-[var(--type-effect)] border-[var(--type-effect)]/30',
}

// Type to icon mapping
export const typeIcons: Record<string, LucideIcon> = {
  'music': Music,
  'ambiance': Volume2,
  'effect': Sparkles,
}

// Default category styling
export const defaultCategoryStyle = 'bg-muted text-muted-foreground border-border'

// Default type styling
export const defaultTypeStyle = 'bg-muted text-muted-foreground border-border'

