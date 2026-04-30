import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Safety check (recommended)
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase env variables missing");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;