
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
    console.log("Attempting to send email via Supabase function:", { 
      to, 
      subject,
      contentLength: content?.length
    });
    
    // Añadimos un timeout más largo para darle tiempo a la función
    const startTime = performance.now();
    
    // Remove the options property since it's not supported in the type definition
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { 
        to, 
        subject, 
        html: content, 
        attachments
      }
    });

    const elapsedTime = performance.now() - startTime;
    console.log(`Email function call completed in ${elapsedTime.toFixed(2)}ms`);

    if (error) {
      console.error("Supabase function error:", error);
      
      // Enriquecer los mensajes de error para una mejor depuración
      let enhancedMessage = error.message;
      
      if (error.name === 'FunctionsFetchError') {
        enhancedMessage = `Error de conexión: ${error.message}. Esto puede deberse a problemas de red, timeout, o que la función no está disponible.`;
      } else if (error.name === 'FunctionsHttpError') {
        enhancedMessage = `Error HTTP (${error.context?.status || 'desconocido'}): ${error.message}`;
      } else if (error.name === 'FunctionsRelayError') {
        enhancedMessage = `Error de relay: ${error.message}. Puede haber un problema con el servicio de Supabase Functions.`;
      }
      
      error.message = enhancedMessage;
      throw error;
    }

    if (!data) {
      throw new Error("No response received from email function");
    }

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    throw error;
  }
};
