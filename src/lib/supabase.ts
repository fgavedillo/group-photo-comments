
/**
 * Single source of truth for Supabase client
 * This file exports the Supabase client instance used throughout the application
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase-types';

// Use environment variables or fallback to static values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I";

/**
 * Create a single instance of the Supabase client
 * This prevents the "Multiple GoTrueClient instances detected" warning
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Configure headers for all requests to include API key
    fetch: (url, options = {}) => {
      // Create a new options object with existing options and ensure headers exist
      const fetchOptions = {
        ...options,
        headers: {
          ...(options as any).headers || {},
          apikey: supabaseAnonKey,
        },
      };
      return fetch(url, fetchOptions);
    },
  },
});

// Export the single instance as default
export default supabase;
