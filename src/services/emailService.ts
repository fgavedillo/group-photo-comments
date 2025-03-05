
import { callApi, ApiResponse } from './api/apiClient';

/**
 * Interfaz para la respuesta del envío de email
 */
interface EmailSendResponse {
  success: boolean;
  message?: string;
  recipients?: string[];
  elapsedTime?: string;
  requestId?: string;
  processingTime?: string;
  messageId?: string;
}

/**
 * Constantes para URLs
 */
const FUNCTIONS_BASE_URL = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1";
const DAILY_REPORT_FUNCTION = `${FUNCTIONS_BASE_URL}/send-daily-report`;
const EMAIL_FUNCTION = `${FUNCTIONS_BASE_URL}/send-email`;

/**
 * Envía un reporte por correo manual (filtrado o completo)
 */
export const sendManualEmail = async (filtered: boolean = false): Promise<ApiResponse<EmailSendResponse>> => {
  try {
    console.log(`Iniciando envío de correo manual (${filtered ? 'filtrado' : 'completo'})`);
    
    // Generar ID único para esta solicitud
    const requestId = `manual-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Enviar solicitud con timeout apropiado
    return await callApi<EmailSendResponse>(
      DAILY_REPORT_FUNCTION,
      'POST',
      { 
        manual: true,
        filteredByUser: filtered,
        requestId
      },
      { 
        timeout: 60000, // 60 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error general en el envío de correo:', error);
    
    // Verificar si es un error de red
    const isNetworkError = 
      error.message?.includes('Failed to fetch') || 
      error.message?.includes('Network Error') ||
      error.message?.includes('network');
    
    return {
      success: false,
      error: {
        message: isNetworkError
          ? 'Error de conexión: No se pudo contactar al servidor. Verifique su conexión a internet.'
          : error.message || 'No se pudo enviar el correo programado',
        details: `
          Error general en la función de envío de correo:
          - Mensaje: ${error.message || 'No disponible'}
          - Stack: ${error.stack || 'No disponible'}
          
          ${isNetworkError ? `
          Es posible que:
          1. Su conexión a internet esté fallando
          2. El servidor de Supabase no esté disponible
          3. La función edge no esté publicada correctamente
          
          Recomendación: Verifique su conexión y que la función edge esté publicada.
          ` : `
          Esto puede ser un error en el código del cliente o un problema con la conexión.
          Recomendación: Revise la consola del navegador para más detalles.
          `}
        `,
        code: isNetworkError ? 'NETWORK_ERROR' : 'CLIENT_ERROR',
        context: { 
          originalError: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        }
      }
    };
  }
};

/**
 * Prueba la conexión con el servidor de correo
 */
export const testEmailConnection = async (): Promise<ApiResponse<{success: boolean, details?: string}>> => {
  try {
    console.log("Probando conexión con el servidor de correo...");
    
    // Realizar una solicitud OPTIONS para verificar que el servidor responde
    const response = await fetch(EMAIL_FUNCTION, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        success: true,
        data: {
          success: true,
          details: `El servidor respondió correctamente con estado ${response.status}`
        }
      };
    } else {
      return {
        success: false,
        error: {
          message: `Error de conexión: El servidor respondió con estado ${response.status}`,
          code: 'CONNECTION_ERROR',
          details: `La función de correo respondió con estado ${response.status} ${response.statusText}`
        }
      };
    }
  } catch (error) {
    console.error("Error probando la conexión:", error);
    
    return {
      success: false,
      error: {
        message: "No se pudo establecer conexión con el servidor de correo",
        code: 'CONNECTION_ERROR',
        details: `Error: ${error.message || 'Error desconocido'}`
      }
    };
  }
};
