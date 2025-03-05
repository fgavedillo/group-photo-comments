
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
}

/**
 * Envía un reporte por correo manual (filtrado o completo)
 */
export const sendManualEmail = async (filtered: boolean = false): Promise<ApiResponse<EmailSendResponse>> => {
  try {
    console.log(`Iniciando envío de correo manual (${filtered ? 'filtrado' : 'completo'})`);
    
    // URL de la función
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report";
    
    // Enviar solicitud con timeout apropiado
    return await callApi<EmailSendResponse>(
      functionUrl,
      'POST',
      { 
        manual: true,
        filteredByUser: filtered,
        requestId: `manual-email-${Date.now()}`
      },
      { timeout: 60000 } // 60 segundos de timeout
    );
  } catch (error) {
    console.error('Error general en el envío de correo:', error);
    
    return {
      success: false,
      error: {
        message: error.message || 'No se pudo enviar el correo programado',
        details: `
          Error general en la función de envío de correo:
          - Mensaje: ${error.message || 'No disponible'}
          - Stack: ${error.stack || 'No disponible'}
          
          Esto puede ser un error en el código del cliente o un problema con la conexión.
          Recomendación: Revise la consola del navegador para más detalles.
        `,
        code: 'CLIENT_ERROR',
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
