import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wrhzzriymzvcqapjaumi.supabase.co' 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyaHp6cml5bXp2Y3FhcGphdW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNTIyODYsImV4cCI6MjA3OTYyODI4Nn0.x4Vm4qS_400ycHPwKG0u3ZxSTqSdTuM_9LTd0uNdNOg'

export const supabase = createClient(supabaseUrl, supabaseKey)