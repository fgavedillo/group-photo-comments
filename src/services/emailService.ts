
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

    // Call the Edge Function with the complete URL to avoid resolution issues
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report";
    
    // Preparar los headers
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    
    // Obtener la sesión actual de forma asíncrona
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    // Usar el apiKey de forma segura obteniendo la URL y la key por separado
    const apiKey = supabase.supabaseUrl.includes('supabase.co') 
      ? (supabase as any).restUrl.match(/apikey=([^&]+)/)?.[1] || ''
      : '';
    
    headers.append("Authorization", `Bearer ${accessToken}`);
    if (apiKey) {
      headers.append("apikey", apiKey);
    }
    
    // Usar fetch directamente para tener más control sobre la solicitud
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ 
        manual: true,
        filteredByUser: filtered,
        requestId
      }),
    });

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
        
        Recomendaciones:
        - Verificar las credenciales de autenticación
        - Revisar los logs del servidor
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
  } catch (error) {
    console.error('Error al enviar correo:', error);
    
    // Detectar si es un error de conexión (fetch)
    const isFetchError = error.name === 'TypeError' && error.message.includes('fetch');
    const errorMessage = isFetchError
      ? 'Error de conexión: No se pudo establecer comunicación con el servidor. Compruebe su conexión a internet o si el servidor está disponible.'
      : error.message || 'No se pudo enviar el correo programado';
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: isFetchError ? 'CONNECTION_ERROR' : 'CLIENT_ERROR',
        context: { originalError: error }
      }
    };
  }
};
