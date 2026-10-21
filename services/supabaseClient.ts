import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hulzkkzloimnhntccazw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CUdrTPUiiUa2iTQf6uei2A_3eYosbG6';

export const supabase = createClient(supabaseUrl, supabaseKey);
