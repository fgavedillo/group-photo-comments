
import { supabase } from "@/lib/supabase";

interface SendEmailResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    details?: string;
  };
}

export const sendManualEmail = async (filtered: boolean = false): Promise<SendEmailResponse> => {
  try {
    console.log(`Iniciando envío manual de correo ${filtered ? 'filtrado' : 'completo'}`);
    
    // Call the Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-daily-report', {
      body: { 
        manual: true,
        filteredByUser: filtered
      }
    });

    if (error) {
      console.error('Error en la respuesta de la función:', error);
      
      // Extract detailed error information
      let errorMessage = `Error en el servidor: ${error.message || 'Desconocido'}`;
      let detailedInfo = '';
      
      if (error.name === 'FunctionsFetchError') {
        errorMessage = 'Error de conexión con el servidor. No se pudo establecer comunicación con la función.';
        detailedInfo = `
          Detalles técnicos:
          - Tipo de error: ${error.name}
          - Mensaje: ${error.message}
          
          Posibles causas:
          - Problemas de red o conexión
          - La función puede estar desactivada o en mantenimiento
          - Tiempo de respuesta excedido (timeout)
          
          Recomendaciones:
          - Verificar su conexión a internet
          - Intentar nuevamente en unos minutos
          - Contactar al administrador si el problema persiste
        `;
      }
      
      return {
        success: false,
        error: {
          message: errorMessage,
          details: detailedInfo
        }
      };
    }

    console.log("Respuesta del envío de correo:", data);
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    
    return {
      success: false,
      error: {
        message: error.message || 'No se pudo enviar el correo programado'
      }
    };
  }
};
