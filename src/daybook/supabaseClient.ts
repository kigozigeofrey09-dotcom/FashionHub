import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgeomsujudvcjrryupbp.supabase.co';
const supabaseKey = 'sb_publishable_dag-N0A5lV-xpDVEX5jLYg__COcS21Q';

export const dayBookSupabase = createClient(supabaseUrl, supabaseKey);
