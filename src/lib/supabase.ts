
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  type: string;
}

export const sendEmail = async (to: string, subject: string, content: string, attachments?: Attachment[], cc?: string[]) => {
  try {
    console.log("Enviando correo a:", to);
    
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email";
    
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("apikey", supabaseAnonKey);
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (accessToken) {
      headers.append("Authorization", `Bearer ${accessToken}`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
    
    const requestId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      console.log(`[${requestId}] Enviando solicitud a ${functionUrl}`);
      
      const payload = {
        to,
        subject,
        html: content,
        requestId,
        attachments
      };
      
      // Add CC if provided
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
          // Si no podemos parsear como JSON, usamos el texto plano
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
