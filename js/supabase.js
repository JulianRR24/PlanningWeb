import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://hmtnewymuanlvdbfdmrh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdG5ld3ltdWFubHZkYmZkbXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODE3ODcsImV4cCI6MjA3OTc1Nzc4N30.midJmbMWczpGBRnrXHzjNS1xkeu7wowT9JTWKeocGyU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)