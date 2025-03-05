
import { callApi, ApiResponse } from './api/apiClient';

/**
 * Interface for email sending response
 */
interface EmailSendResponse {
  success: boolean;
  message?: string;
  recipients?: string[];
  elapsedTime?: string;
  requestId?: string;
}

/**
 * Send a manual email report (filtered or full)
 */
export const sendManualEmail = async (filtered: boolean = false): Promise<ApiResponse<EmailSendResponse>> => {
  try {
    console.log(`Starting manual email send (${filtered ? 'filtered' : 'full'})`);
    
    // Function URL
    const functionUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report";
    
    // Send request with appropriate timeout
    return await callApi<EmailSendResponse>(
      functionUrl,
      'POST',
      { 
        manual: true,
        filteredByUser: filtered,
      },
      { timeout: 60000 } // 60 second timeout
    );
  } catch (error) {
    console.error('General error in email sending:', error);
    
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
