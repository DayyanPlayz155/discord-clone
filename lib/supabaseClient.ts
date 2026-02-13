import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yaevwjzcystyaatcwjaz.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZXZ3anpjeXN0eWFhdGN3amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDAzNzcsImV4cCI6MjA4NjU3NjM3N30.7S4MhX7KAFnhV31arsOdNuWLHsTD1xo_sJZVQ7z8I-Y'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)