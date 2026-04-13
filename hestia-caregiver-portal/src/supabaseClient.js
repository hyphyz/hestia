import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log this during debugging to see if they are actually loading
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase environment variables are missing! Check your .env file location.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', // Prevents the 'required' crash
  supabaseAnonKey || 'placeholder'
);