/**
 * Single source of truth for Supabase client
 * This file exports the Supabase client instance used throughout the application
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase-types';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzmzjvtxcrxljnhhrjo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXpqdnR4Y3J4bGpuaGhyam8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMjc2NDcwMCwiZXhwIjoyMDI4MzQwNzAwfQ.MZzRjwNuIKHTsM3kbVufjAQHgVOA-zRdHCH_8MYsEZ8';

// Configuración para el cliente de Supabase
const options = {
  auth: {
    persistSession: true, // Persistir la sesión en localStorage
    autoRefreshToken: true, // Refrescar automáticamente el token
    detectSessionInUrl: true, // Detectar tokens en la URL (para autenticación OAuth)
    storage: window.localStorage // Usar localStorage como almacenamiento
  },
  realtime: {
    // Configuración para tiempo real
    timeout: 30000, // Timeout para operaciones en tiempo real
    params: {
      eventsPerSecond: 10 // Limitar eventos por segundo
    }
  },
};

/**
 * Create a single instance of the Supabase client
 * This prevents the "Multiple GoTrueClient instances detected" warning
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, options);

// Verificar la sesión al cargar para debugging
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Error al obtener la sesión:', error);
  } else if (data?.session) {
    console.log('Sesión activa encontrada. Usuario:', data.session.user.email);
  } else {
    console.log('No hay sesión activa.');
  }
});

// Export the single instance as default
export default supabase;
