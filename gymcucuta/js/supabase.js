import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://aaxkqxzfyhbbsjqpwygi.supabase.co'
const SUPABASE_KEY = 'sb_publishable_57vha-_mYUL3bzD4fadLTQ_pB-idtNB'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
