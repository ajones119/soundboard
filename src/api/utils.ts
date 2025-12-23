import { QueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'
// create a supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

// create a query client
export const queryClient = new QueryClient();