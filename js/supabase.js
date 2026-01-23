import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://qwsfujjvjxiyawtbcaxj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3c2Z1amp2anhpeWF3dGJjYXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTI2MjcsImV4cCI6MjA4NDc2ODYyN30.LKHugd7auMc5tmaypAuEISrlnwbHb1P_pbFK_TSOSW0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)