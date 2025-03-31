
import { callApi } from '@/services/api/apiClient';

export async function sendReport(recipients: string[], reportData: any) {
  try {
    // Verificar que tenemos destinatarios
    if (!recipients || recipients.length === 0) {
      throw new Error("No se proporcionaron destinatarios para el envío del correo");
    }

    // Filtrar y validar correos
    const validRecipients = recipients.filter(email => {
      return email && typeof email === 'string' && email.trim() !== '' && email.includes('@');
    });

    if (validRecipients.length === 0) {
      throw new Error("No hay destinatarios válidos para enviar el reporte");
    }

    console.log(`Enviando correo a ${validRecipients.length} destinatarios válidos:`, validRecipients);
    
    // Si reportData es un string, es HTML, de lo contrario genera un HTML simple
    const isHtmlContent = typeof reportData === 'string';
    
    // Agregar un texto de introducción
    const introText = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">Reporte de Incidencias PRL Conecta</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Estimado usuario,
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          A continuación se presenta el reporte de incidencias generado automáticamente por el sistema PRL Conecta.
          Este informe incluye información sobre las incidencias registradas en el sistema.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    `;

    // Generar un contenido HTML básico si no se proporciona
    let emailContent = isHtmlContent 
      ? reportData 
      : `<div style="font-family: Arial, sans-serif; padding: 20px;">
           <h2>Reporte de Incidencias</h2>
           <pre>${JSON.stringify(reportData, null, 2)}</pre>
         </div>`;

    // Generar el HTML completo con la introducción
    const htmlContent = `${introText}${emailContent}`;

    // Cliente ID para seguimiento
    const requestId = `report-${Date.now()}`;
    
    // Realizar la petición a la función Edge
    const response = await callApi({
      url: 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report',
      method: 'POST',
      data: {
        to: validRecipients,
        subject: 'Reporte de Incidencias PRL Conecta',
        html: htmlContent,
        clientRequestId: requestId
      },
      config: {
        timeout: 30000 // 30 segundos
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error al enviar el correo');
    }

    console.log('Respuesta exitosa del servicio de correo:', response.data);
    
    return { 
      success: true, 
      data: response.data,
      recipients: validRecipients,
      error: null
    };
  } catch (error) {
    console.error('Error al enviar reporte:', error);
    return {
      success: false,
      data: null,
      recipients: recipients,
      error: error.message || "Error desconocido"
    };
  }
}
