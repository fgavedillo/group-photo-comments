
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

    // Usar la URL correcta para la función Edge
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report";
    
    // Preparar los headers con información completa
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    
    // Obtener la sesión actual de forma asíncrona
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';
    
    // Usar un apiKey directamente
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I';
    
    // Añadir tokens de autenticación a los headers
    if (accessToken) {
      headers.append("Authorization", `Bearer ${accessToken}`);
    }
    headers.append("apikey", apiKey);
    
    // Implementar timeout para la solicitud fetch con un tiempo mayor
    const controller = new AbortController();
    const timeoutDuration = 60000; // 60 segundos de timeout
    const timeout = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      console.log(`[ID:${requestId}] Enviando solicitud con timeout de ${timeoutDuration/1000}s`);
      console.log(`[ID:${requestId}] URL: ${functionUrl}`);
      console.log(`[ID:${requestId}] Payload:`, JSON.stringify({ 
        manual: true,
        filteredByUser: filtered,
        requestId
      }));

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
      console.log(`[ID:${requestId}] Tiempo de respuesta: ${elapsedTime.toFixed(2)}ms, Status: ${response.status}`);

      if (!response.ok) {
        console.error(`[ID:${requestId}] Error HTTP: ${response.status} ${response.statusText}`);
        
        // Intentar leer el cuerpo del error, si está disponible
        let errorBody;
        try {
          errorBody = await response.text();
          console.error(`[ID:${requestId}] Cuerpo de la respuesta de error:`, errorBody);
          
          // Intentar parsear como JSON si es posible
          try {
            const jsonError = JSON.parse(errorBody);
            if (jsonError.error) {
              return {
                success: false,
                error: {
                  message: jsonError.error.message || `Error en el servidor: HTTP ${response.status}`,
                  details: jsonError.error.details || errorBody,
                  code: jsonError.error.code || `HTTP_ERROR_${response.status}`,
                  context: {
                    ...jsonError.error.context,
                    requestId,
                    elapsedTime: `${elapsedTime.toFixed(2)}ms`,
                    statusCode: response.status,
                    statusText: response.statusText
                  }
                }
              };
            }
          } catch (parseError) {
            console.error(`[ID:${requestId}] No se pudo parsear el error como JSON:`, parseError);
          }
        } catch (readError) {
          console.error(`[ID:${requestId}] No se pudo leer el cuerpo de la respuesta:`, readError);
          errorBody = "No se pudo leer el cuerpo de la respuesta";
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
          - Problemas de autenticación o token de acceso caducado
          - La función Edge no está disponible o ha fallado internamente
          - Error en los parámetros enviados
          - Problemas de CORS o conectividad
          
          Recomendaciones:
          - Verificar que has iniciado sesión correctamente
          - Comprobar que la función Edge está publicada y activa
          - Verificar la configuración de Gmail en los secretos de Supabase
          - Revisar los logs de la función Edge para más detalles
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
        console.error(`[ID:${requestId}] La solicitud excedió el tiempo de espera (${timeoutDuration/1000}s)`);
        return {
          success: false,
          error: {
            message: `La solicitud ha excedido el tiempo máximo de espera (${timeoutDuration/1000} segundos)`,
            details: `Es posible que la función Edge esté tardando demasiado en procesar la solicitud o que haya problemas de conectividad. Revisa los logs de la función Edge para más detalles.`,
            code: 'TIMEOUT_ERROR',
            context: { requestId }
          }
        };
      }
      
      // Otros errores de fetch
      console.error(`[ID:${requestId}] Error de fetch:`, fetchError);
      
      // Determinar si es un error de CORS
      const isCorsError = fetchError.message && (
        fetchError.message.includes('CORS') || 
        fetchError.message.includes('cross-origin') ||
        fetchError.message.includes('Cross-Origin')
      );
      
      // Determinar si es un error de red
      const isNetworkError = 
        fetchError.name === 'TypeError' || 
        fetchError.message.includes('network') || 
        fetchError.message.includes('internet') ||
        fetchError.message.includes('failed to fetch');
      
      const errorCode = isCorsError ? 'CORS_ERROR' : (isNetworkError ? 'NETWORK_ERROR' : 'FETCH_ERROR');
      const errorMessage = isCorsError 
        ? 'Error de CORS: La solicitud fue bloqueada por política de seguridad de origen cruzado'
        : (isNetworkError
            ? 'Error de red: No se pudo conectar con el servidor. Compruebe su conexión a internet.'
            : `Error al enviar la solicitud: ${fetchError.message || 'Error desconocido'}`);
            
      const detailedMessage = isCorsError
        ? `
          La solicitud fue bloqueada por política de seguridad de origen cruzado (CORS).
          Esto puede ocurrir si:
          1. La función Edge no tiene configurados correctamente los encabezados CORS
          2. Hay un problema con la URL o el dominio de la solicitud
          3. La función no está publicada o accesible
          
          Recomendación: Verifica que la función Edge esté correctamente configurada y publicada.
        `
        : (isNetworkError
            ? `
              No se pudo establecer conexión con el servidor. Esto puede deberse a:
              1. Problemas con su conexión a internet
              2. El servidor no está disponible o no responde
              3. La URL de la función Edge es incorrecta
              
              Recomendación: Verifique su conexión a internet y que la URL de la función sea correcta.
            `
            : `
              Error al enviar la solicitud: ${fetchError.message || 'Error desconocido'}.
              Detalles adicionales: ${JSON.stringify(fetchError)}
              
              Recomendación: Revise los logs del navegador para más información.
            `);
      
      return {
        success: false,
        error: {
          message: errorMessage,
          details: detailedMessage,
          code: errorCode,
          context: { 
            requestId,
            originalError: {
              name: fetchError.name,
              message: fetchError.message,
              stack: fetchError.stack
            }
          }
        }
      };
    }
  } catch (error) {
    console.error('Error general al enviar correo:', error);
    
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
        details: `
          Error general en la función de envío de correo:
          - Mensaje: ${error.message || 'No disponible'}
          - Stack: ${error.stack || 'No disponible'}
          
          Esto puede ser un error en el código del cliente o un problema con la conexión.
          Recomendación: Revise la consola del navegador para más detalles.
        `,
        code: isNetworkError ? 'CONNECTION_ERROR' : 'CLIENT_ERROR',
        context: { originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }}
      }
    };
  }
};
