
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase' // ajusta esta ruta si es necesario

// Uso de variables de entorno o valores estáticos para desarrollo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Crear una única instancia del cliente
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Exportar la instancia única
export const getSupabaseClient = () => supabase

// También exportamos la instancia directamente
export default supabase
