import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
        signUp: async () => ({ error: { message: "Supabase environment variables not configured in Vercel" } }),
        signInWithPassword: async () => ({ error: { message: "Supabase environment variables not configured in Vercel" } }),
        verifyOtp: async () => ({ error: { message: "Supabase environment variables not configured in Vercel" } }),
      }
    };

