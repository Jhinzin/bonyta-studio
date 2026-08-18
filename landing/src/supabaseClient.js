import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rdtblrdtnwoipixckgeh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdGJscmR0bndvaXBpeGNrZ2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjI4NDIsImV4cCI6MjA5Nzk5ODg0Mn0.tl20T9PsjaykXMKtoTXkBoHDI_sicOsFhB3I7OTVw9k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
