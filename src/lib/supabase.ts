
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Define una interfaz consistente para los payloads de email para evitar errores de tipo
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  requestId: string;
  attachments?: Attachment[];
  cc?: string[];
}

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  type: string;
}

export const sendEmail = async (to: string, subject: string, content: string, attachments?: Attachment[], cc?: string[]) => {
  try {
    console.log("Enviando correo a:", to);
    console.log("Asunto:", subject);
    
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email";
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("apikey", supabaseAnonKey);
    
    // No añadimos cabeceras de autorización - La función Edge no requiere verificación JWT
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
    
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
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error("Tiempo de espera excedido");
        throw new Error("La operación ha excedido el tiempo máximo de espera (30 segundos)");
      }
      
      console.error("Error en la solicitud fetch:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error en función sendEmail:', error);
    throw error;
  }
};
