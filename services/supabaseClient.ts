import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hulzkkzloimnhntccazw.supabase.co';
const supabaseKey = 'sb_publishable_CUdrTPUiiUa2iTQf6uei2A_3eYosbG6';

export const supabase = createClient(supabaseUrl, supabaseKey);
