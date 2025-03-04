
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

export const sendEmail = async (to: string, subject: string, content: string, attachments?: Attachment[]) => {
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
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          to,
          subject,
          html: content,
          attachments
        }),
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
          }
        } catch (e) {
          // Si no podemos parsear como JSON, usamos el texto plano
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error("La operación ha excedido el tiempo máximo de espera (15 segundos)");
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error en función sendEmail:', error);
    throw error;
  }
};
