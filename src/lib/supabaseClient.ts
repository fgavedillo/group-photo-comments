
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

// Crear una única instancia del cliente
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Exportar la instancia única
export { supabase }
export default supabase

// Define una interfaz consistente para los payloads de email
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
