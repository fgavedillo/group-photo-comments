
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
    console.log("Intentando enviar correo vía función de Supabase:", { 
      to, 
      subject,
      contentLength: content?.length
    });
    
    // Generar ID de solicitud para seguimiento
    const requestId = crypto.randomUUID();
    
    // Medir tiempo de ejecución
    const startTime = performance.now();
    
    // Usar llamada directa a la función Edge con timeout más largo
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email";
    
    // Preparar headers
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("apikey", supabaseAnonKey);
    
    // Obtener token de autorización si está disponible
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (accessToken) {
      headers.append("Authorization", `Bearer ${accessToken}`);
    }
    
    // Configurar timeout
    const controller = new AbortController();
    const timeoutDuration = 60000; // 60 segundos
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    console.log(`[ID:${requestId}] Enviando correo a ${to} con timeout de ${timeoutDuration/1000}s`);
    
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          to,
          subject,
          html: content,
          attachments,
          requestId
        }),
        signal: controller.signal
      });
      
      // Limpiar timeout
      clearTimeout(timeoutId);
      
      const elapsedTime = performance.now() - startTime;
      console.log(`[ID:${requestId}] Respuesta recibida en ${elapsedTime.toFixed(2)}ms, Status: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
        let errorDetails;
        
        try {
          const errorData = await response.text();
          console.error(`[ID:${requestId}] Detalles del error:`, errorData);
          
          try {
            // Intentar parsear como JSON
            const jsonError = JSON.parse(errorData);
            if (jsonError.error) {
              errorMessage = jsonError.error.message || errorMessage;
              errorDetails = jsonError.error.details || errorData;
            }
          } catch (parseError) {
            errorDetails = errorData;
          }
        } catch (e) {
          errorDetails = "No se pudieron obtener detalles del error";
        }
        
        throw new Error(errorMessage + (errorDetails ? `\n\nDetalles: ${errorDetails}` : ''));
      }
      
      const data = await response.json();
      console.log(`[ID:${requestId}] Correo enviado exitosamente:`, data);
      
      return {
        ...data,
        requestId,
        elapsedTime: `${elapsedTime.toFixed(2)}ms`
      };
    } catch (fetchError) {
      // Limpiar timeout
      clearTimeout(timeoutId);
      
      // Manejar error específico de timeout
      if (fetchError.name === 'AbortError') {
        console.error(`[ID:${requestId}] La solicitud excedió el tiempo de espera (${timeoutDuration/1000}s)`);
        throw new Error(`La solicitud de envío de correo ha excedido el tiempo máximo de espera (${timeoutDuration/1000} segundos)`);
      }
      
      console.error(`[ID:${requestId}] Error al enviar correo:`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error en función sendEmail:', error);
    
    // Enriquecer el mensaje de error
    if (error.message.includes('failed to fetch')) {
      error.message = `Error de conexión: No se pudo contactar con el servidor. 
      Verifique su conexión a internet y que la función Edge esté publicada correctamente.
      Error original: ${error.message}`;
    }
    
    throw error;
  }
};
