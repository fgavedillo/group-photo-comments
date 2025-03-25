import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase' // ajusta esta ruta si es necesario

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

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