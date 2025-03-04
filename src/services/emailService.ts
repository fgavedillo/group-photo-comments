
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
    
    // Call the Edge Function to send the email with retry logic
    const { data, error } = await invokeWithRetry('send-daily-report', { 
      manual: true,
      filteredByUser: filtered,
      requestId
    });

    const elapsedTime = performance.now() - startTime;
    console.log(`[ID:${requestId}] Tiempo de respuesta: ${elapsedTime.toFixed(2)}ms`);

    if (error) {
      console.error(`[ID:${requestId}] Error en la respuesta de la función:`, error);
      
      // Extract detailed error information
      let errorMessage = `Error en el servidor: ${error.message || 'Desconocido'}`;
      let detailedInfo = '';
      let errorCode = error.name || 'UnknownError';
      
      if (error.name === 'FunctionsFetchError') {
        errorMessage = 'Error de conexión con el servidor. No se pudo establecer comunicación con la función.';
        errorCode = 'CONNECTION_ERROR';
        detailedInfo = `
          Detalles técnicos:
          - Tipo de error: ${error.name}
          - Mensaje: ${error.message}
          - ID de solicitud: ${requestId}
          - Tiempo transcurrido: ${elapsedTime.toFixed(2)}ms
          
          Posibles causas:
          - Problemas de red o conexión
          - La función puede estar desactivada o en mantenimiento
          - Tiempo de respuesta excedido (timeout)
          - CORS no configurado correctamente
          
          Recomendaciones:
          - Verificar su conexión a internet
          - Intentar nuevamente en unos minutos
          - Solicitar al administrador verificar los logs de la función Edge
        `;
      } else if (error.name === 'FunctionsHttpError') {
        const statusCode = error.context?.status;
        errorMessage = `Error HTTP (${statusCode || 'desconocido'}): ${error.message}`;
        errorCode = `HTTP_ERROR_${statusCode || 'UNKNOWN'}`;
        detailedInfo = `
          Detalles técnicos:
          - Tipo de error: ${error.name}
          - Mensaje: ${error.message}
          - Código de estado: ${statusCode || 'No disponible'}
          - ID de solicitud: ${requestId}
          - Tiempo transcurrido: ${elapsedTime.toFixed(2)}ms
          
          El servidor Edge respondió con un error. Es posible que:
          - La función encontró un problema interno
          - Los parámetros enviados sean incorrectos
          - Haya un problema con los permisos o credenciales
          
          Revise los logs del servidor para más detalles.
        `;
      } else if (error.name === 'FunctionsRelayError') {
        errorMessage = `Error de relay: ${error.message}`;
        errorCode = 'RELAY_ERROR';
        detailedInfo = `
          Detalles técnicos:
          - Tipo de error: ${error.name}
          - Mensaje: ${error.message}
          - ID de solicitud: ${requestId}
          - Tiempo transcurrido: ${elapsedTime.toFixed(2)}ms
          
          Hay un problema en la infraestructura que conecta su aplicación con la función Edge.
          Esto puede deberse a problemas temporales en Supabase o configuraciones incorrectas.
        `;
      }
      
      return {
        success: false,
        error: {
          message: errorMessage,
          details: detailedInfo,
          code: errorCode,
          context: {
            requestId,
            elapsedTime: `${elapsedTime.toFixed(2)}ms`,
            originalError: error
          }
        }
      };
    }

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
    
    return {
      success: false,
      error: {
        message: error.message || 'No se pudo enviar el correo programado',
        code: 'CLIENT_ERROR',
        context: { originalError: error }
      }
    };
  }
};

// Función auxiliar para invocar la función Edge con reintentos
async function invokeWithRetry(functionName: string, payload: any, maxRetries = 2) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Si no es el primer intento, esperar antes de reintentar
      if (attempt > 0) {
        const retryDelay = attempt * 1000; // Incrementar el tiempo entre reintentos
        console.log(`Reintentando llamada a ${functionName} en ${retryDelay}ms (intento ${attempt} de ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      const response = await supabase.functions.invoke(functionName, { body: payload });
      return response;
    } catch (error) {
      console.warn(`Error en intento ${attempt + 1}/${maxRetries + 1} llamando a ${functionName}:`, error);
      lastError = error;
      
      // Si es el último intento, propagar el error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  // Este código no debería ejecutarse, pero lo incluimos por seguridad
  throw lastError;
}
