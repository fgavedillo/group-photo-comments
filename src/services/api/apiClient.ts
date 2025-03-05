
import { supabase } from "@/lib/supabase";

/**
 * Base configuration for API requests
 */
export interface ApiRequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
    code?: string;
    context?: any;
  };
}

/**
 * Creates headers for Supabase function requests with auth tokens
 */
export async function createRequestHeaders(): Promise<Headers> {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  
  // Get current session for authentication
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token || '';
  
  // Add authentication headers
  if (accessToken) {
    headers.append("Authorization", `Bearer ${accessToken}`);
  }
  
  // Use the anon key for API access
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I';
  headers.append("apikey", apiKey);
  
  return headers;
}

/**
 * Base function to make API requests with timeout and error handling
 */
export async function callApi<T = any>(
  url: string, 
  method: string, 
  payload: any, 
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const requestId = crypto.randomUUID();
  console.log(`[ID:${requestId}] Starting API request to ${url}`);
  
  // Set default timeout
  const timeoutDuration = config.timeout || 60000; // Default 60s timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutDuration);
  
  // Measure performance
  const startTime = performance.now();
  
  try {
    // Get headers (with auth tokens)
    const headers = config.headers ? new Headers(config.headers) : await createRequestHeaders();
    
    console.log(`[ID:${requestId}] Sending ${method} request with timeout of ${timeoutDuration/1000}s`);
    console.log(`[ID:${requestId}] Payload:`, JSON.stringify(payload));
    
    // Make the request
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal
    });
    
    // Clear timeout as we got a response
    clearTimeout(timeout);
    
    // Log performance metrics
    const elapsedTime = performance.now() - startTime;
    console.log(`[ID:${requestId}] Response received in ${elapsedTime.toFixed(2)}ms, Status: ${response.status}`);
    
    // Handle response errors
    if (!response.ok) {
      return await handleApiError(response, requestId, elapsedTime);
    }
    
    // Parse successful response
    const data = await response.json();
    
    return {
      success: true,
      data: {
        ...data,
        requestId,
        elapsedTime: `${elapsedTime.toFixed(2)}ms`
      }
    };
  } catch (error) {
    // Clear timeout in case of error
    clearTimeout(timeout);
    return handleFetchError(error, requestId);
  }
}

/**
 * Handle API response errors
 */
async function handleApiError(
  response: Response, 
  requestId: string, 
  elapsedTime: number
): Promise<ApiResponse> {
  console.error(`[ID:${requestId}] Error HTTP: ${response.status} ${response.statusText}`);
  
  // Try to read the error body
  let errorBody;
  try {
    errorBody = await response.text();
    console.error(`[ID:${requestId}] Error response body:`, errorBody);
    
    // Try to parse as JSON
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
      console.error(`[ID:${requestId}] Failed to parse error as JSON:`, parseError);
    }
  } catch (readError) {
    console.error(`[ID:${requestId}] Failed to read response body:`, readError);
    errorBody = "Could not read response body";
  }
  
  // Fallback error response
  return {
    success: false,
    error: {
      message: `Error en el servidor: HTTP ${response.status}`,
      details: getDetailedErrorInfo(response, requestId, elapsedTime, errorBody),
      code: `HTTP_ERROR_${response.status}`,
      context: {
        requestId,
        elapsedTime: `${elapsedTime.toFixed(2)}ms`,
        statusCode: response.status,
        statusText: response.statusText
      }
    }
  };
}

/**
 * Handle fetch errors (network, timeout, etc.)
 */
function handleFetchError(error: any, requestId: string): ApiResponse {
  console.error(`[ID:${requestId}] Fetch error:`, error);
  
  // Detect timeout errors
  if (error.name === 'AbortError') {
    console.error(`[ID:${requestId}] Request timed out`);
    return {
      success: false,
      error: {
        message: `La solicitud ha excedido el tiempo máximo de espera`,
        details: `Es posible que el servidor esté tardando demasiado en procesar la solicitud o que haya problemas de conectividad.`,
        code: 'TIMEOUT_ERROR',
        context: { requestId }
      }
    };
  }
  
  // Detect CORS errors
  const isCorsError = error.message && (
    error.message.includes('CORS') || 
    error.message.includes('cross-origin') ||
    error.message.includes('Cross-Origin')
  );
  
  // Detect network errors
  const isNetworkError = 
    error.name === 'TypeError' || 
    error.message.includes('network') || 
    error.message.includes('internet') ||
    error.message.includes('failed to fetch');
  
  // Generate appropriate error code and message
  const errorCode = isCorsError ? 'CORS_ERROR' : (isNetworkError ? 'NETWORK_ERROR' : 'FETCH_ERROR');
  const errorMessage = getErrorMessageByType(error, isCorsError, isNetworkError);
  
  return {
    success: false,
    error: {
      message: errorMessage,
      details: getDetailedErrorMessageByType(error, isCorsError, isNetworkError),
      code: errorCode,
      context: { 
        requestId,
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }
    }
  };
}

/**
 * Get appropriate error message based on error type
 */
function getErrorMessageByType(error: any, isCorsError: boolean, isNetworkError: boolean): string {
  if (isCorsError) {
    return 'Error de CORS: La solicitud fue bloqueada por política de seguridad de origen cruzado';
  } else if (isNetworkError) {
    return 'Error de red: No se pudo conectar con el servidor. Compruebe su conexión a internet.';
  } else {
    return `Error al enviar la solicitud: ${error.message || 'Error desconocido'}`;
  }
}

/**
 * Generate detailed error information for HTTP errors
 */
function getDetailedErrorInfo(
  response: Response, 
  requestId: string, 
  elapsedTime: number, 
  errorBody?: string
): string {
  return `
    Detalles técnicos:
    - Código de estado: ${response.status}
    - Mensaje de estado: ${response.statusText}
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
}

/**
 * Generate detailed error message based on error type
 */
function getDetailedErrorMessageByType(error: any, isCorsError: boolean, isNetworkError: boolean): string {
  if (isCorsError) {
    return `
      La solicitud fue bloqueada por política de seguridad de origen cruzado (CORS).
      Esto puede ocurrir si:
      1. La función Edge no tiene configurados correctamente los encabezados CORS
      2. Hay un problema con la URL o el dominio de la solicitud
      3. La función no está publicada o accesible
      
      Recomendación: Verifica que la función Edge esté correctamente configurada y publicada.
    `;
  } else if (isNetworkError) {
    return `
      No se pudo establecer conexión con el servidor. Esto puede deberse a:
      1. Problemas con su conexión a internet
      2. El servidor no está disponible o no responde
      3. La URL de la función Edge es incorrecta
      
      Recomendación: Verifique su conexión a internet y que la URL de la función sea correcta.
    `;
  } else {
    return `
      Error al enviar la solicitud: ${error.message || 'Error desconocido'}.
      Detalles adicionales: ${JSON.stringify(error)}
      
      Recomendación: Revise los logs del navegador para más información.
    `;
  }
}
