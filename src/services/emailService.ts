
import { supabase } from "@/lib/supabase";

interface SendEmailResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    details?: string;
    code?: string;
    context?: any;
  };
}

export const sendManualEmail = async (filtered: boolean = false): Promise<SendEmailResponse> => {
  try {
    console.log(`Iniciando envío manual de correo ${filtered ? 'filtrado' : 'completo'}`);
    
    // Generar un ID de solicitud único para seguimiento
    const requestId = crypto.randomUUID();
    console.log(`[ID:${requestId}] Enviando solicitud a la función Edge`);
    
    // Medir tiempo de ejecución
    const startTime = performance.now();

    // Usar una URL absoluta y completa para evitar problemas de resolución
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report";
    
    // Preparar los headers con información completa
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    
    // Obtener la sesión actual de forma asíncrona
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    // Usar un apiKey directamente - evitamos usar process.env que no está disponible en el navegador
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I';
    
    // Añadir tokens de autenticación a los headers
    headers.append("Authorization", `Bearer ${accessToken}`);
    if (apiKey) {
      headers.append("apikey", apiKey);
    }
    
    // Implementar timeout para la solicitud fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
    
    try {
      // Usar fetch con timeout y manejo de errores mejorado
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ 
          manual: true,
          filteredByUser: filtered,
          requestId
        }),
        signal: controller.signal
      });

      // Limpiar el timeout una vez completada la solicitud
      clearTimeout(timeout);

      const elapsedTime = performance.now() - startTime;
      console.log(`[ID:${requestId}] Tiempo de respuesta: ${elapsedTime.toFixed(2)}ms`);

      if (!response.ok) {
        console.error(`[ID:${requestId}] Error HTTP: ${response.status} ${response.statusText}`);
        
        // Intentar leer el cuerpo del error, si está disponible
        let errorBody;
        try {
          errorBody = await response.text();
          console.error(`[ID:${requestId}] Cuerpo de la respuesta de error:`, errorBody);
        } catch (readError) {
          console.error(`[ID:${requestId}] No se pudo leer el cuerpo de la respuesta:`, readError);
        }
        
        // Construir mensaje de error basado en el código de estado
        let errorMessage = `Error en el servidor: HTTP ${response.status}`;
        let errorCode = `HTTP_ERROR_${response.status}`;
        let detailedInfo = `
          Detalles técnicos:
          - Código de estado: ${response.status}
          - Mensaje de estado: ${response.statusText}
          - URL: ${functionUrl}
          - ID de solicitud: ${requestId}
          - Tiempo transcurrido: ${elapsedTime.toFixed(2)}ms
          ${errorBody ? `- Respuesta: ${errorBody}` : ''}
          
          Posibles causas:
          - Problemas de autenticación
          - La función Edge encontró un error interno
          - Error en los parámetros enviados
          - Problemas de CORS o conectividad
          
          Recomendaciones:
          - Verificar las credenciales de autenticación
          - Revisar los logs del servidor
          - Comprobar la conectividad de red
        `;
        
        return {
          success: false,
          error: {
            message: errorMessage,
            details: detailedInfo,
            code: errorCode,
            context: {
              requestId,
              elapsedTime: `${elapsedTime.toFixed(2)}ms`,
              statusCode: response.status,
              statusText: response.statusText
            }
          }
        };
      }

      // Si llegamos aquí, la respuesta fue exitosa
      const data = await response.json();
      console.log(`[ID:${requestId}] Respuesta del envío de correo:`, data);
      
      return {
        success: true,
        data: {
          ...data,
          requestId,
          elapsedTime: `${elapsedTime.toFixed(2)}ms`
        }
      };
    } catch (fetchError) {
      // Limpiar el timeout en caso de error
      clearTimeout(timeout);
      
      // Detectar específicamente errores de timeout
      if (fetchError.name === 'AbortError') {
        console.error(`[ID:${requestId}] La solicitud excedió el tiempo de espera (30s)`);
        return {
          success: false,
          error: {
            message: 'La solicitud ha excedido el tiempo máximo de espera (30 segundos)',
            code: 'TIMEOUT_ERROR',
            context: { requestId }
          }
        };
      }
      
      // Otros errores de fetch
      console.error(`[ID:${requestId}] Error de fetch:`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error al enviar correo:', error);
    
    // Detectar si es un error de conexión (fetch)
    const isFetchError = error.name === 'TypeError' && error.message.includes('fetch');
    const isNetworkError = isFetchError || error.message.includes('network') || error.message.includes('internet');
    
    const errorMessage = isNetworkError
      ? 'Error de conexión: No se pudo establecer comunicación con el servidor. Compruebe su conexión a internet o si el servidor está disponible.'
      : error.message || 'No se pudo enviar el correo programado';
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: isNetworkError ? 'CONNECTION_ERROR' : 'CLIENT_ERROR',
        context: { originalError: error }
      }
    };
  }
};
