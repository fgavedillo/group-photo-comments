
import { createClient } from '@supabase/supabase-js'

// Use hardcoded values instead of environment variables
const supabaseUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I";

// Create a single client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export the single instance
export { supabase };
export default supabase;

// Add a function to get the client for use in services
export const getSupabaseClient = () => supabase;

// Define a consistent interface for email payloads
export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  requestId?: string;
  attachments?: Attachment[];
  cc?: string[];
}

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  type: string;
}

export const sendEmail = async (to: string[], subject: string, content: string, attachments?: Attachment[], cc?: string[]) => {
  try {
    console.log("Enviando correo a:", to);
    console.log("Asunto:", subject);
    
    const functionUrl = `${supabaseUrl}/functions/v1/send-email`;
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("apikey", supabaseAnonKey);
    
    const requestId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      console.log(`[${requestId}] Enviando solicitud a ${functionUrl}`);
      
      // Crear el payload usando nuestra interfaz
      const payload: EmailPayload = {
        to,
        subject,
        html: content,
        requestId,
        attachments
      };
      
      // Añadir CC si se proporciona
      if (cc && cc.length > 0) {
        payload.cc = cc;
      }
      
      console.log(`[${requestId}] Payload:`, JSON.stringify(payload));
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        let errorText = await response.text();
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Si no podemos analizar como JSON, usar texto plano
          errorMessage += ` - ${errorText}`;
        }
        
        console.error(`[${requestId}] Error de respuesta:`, errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`[${requestId}] Respuesta del servicio de correo:`, data);
      return data;
    } catch (fetchError: any) {
      console.error("Error en la solicitud fetch:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error en función sendEmail:', error);
    throw error;
  }
};
