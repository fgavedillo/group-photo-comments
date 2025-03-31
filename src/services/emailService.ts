
/**
 * Servicio simplificado de email (sin funcionalidad)
 * 
 * Este archivo mantiene una estructura básica pero toda la funcionalidad
 * de envío de correos ha sido eliminada.
 */

// Interfaz para la respuesta del envío de email (para mantener compatibilidad)
interface EmailSendResponse {
  success: boolean;
  message?: string;
}

/**
 * Función simulada para probar la conexión con el servidor de correo
 */
export const testEmailConnection = async () => {
  console.log("La funcionalidad de email ha sido deshabilitada");
  return {
    success: false,
    error: {
      message: "La funcionalidad de envío de correos ha sido desactivada",
      code: 'DISABLED',
      details: "Esta funcionalidad ha sido desactivada intencionalmente"
    }
  };
};

/**
 * Función simulada para envío de correos
 */
export async function sendManualEmail(filtered: boolean = false, useResend: boolean = false) {
  console.log("La funcionalidad de email ha sido deshabilitada");
  return {
    success: false,
    error: {
      message: "La funcionalidad de envío de correos ha sido desactivada",
      details: "Esta funcionalidad ha sido desactivada intencionalmente"
    }
  };
}
