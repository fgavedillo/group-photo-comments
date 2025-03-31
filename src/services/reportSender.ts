
import { callApi } from '@/services/api/apiClient';

export async function sendReport(recipients: string[], reportData: any) {
  try {
    // Verificar que tenemos destinatarios
    if (!recipients || recipients.length === 0) {
      throw new Error("No se proporcionaron destinatarios para el envío del correo");
    }

    // Si no se especifica un reporte, usar la generación del dashboard
    const generateDashboard = !reportData || typeof reportData !== 'string';
    
    // Preparar el cuerpo del mensaje (como HTML)
    const emailContent = typeof reportData === 'string' 
      ? reportData 
      : `<div>${JSON.stringify(reportData, null, 2)}</div>`;

    console.log(`Enviando correo a ${recipients.length} destinatarios con Resend`);
    console.log(`Generando dashboard: ${generateDashboard ? 'Sí' : 'No'}`);
    
    // Agregar un texto de introducción que siempre aparecerá en el correo
    const introText = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h1 style="color: #003366;">Reporte de Incidencias PRL Conecta</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Estimado usuario,
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          A continuación se presenta el reporte de incidencias generado automáticamente por el sistema PRL Conecta.
          Este informe incluye información sobre las incidencias registradas en el sistema, su estado actual y otros datos relevantes.
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
        <div style="margin: 20px 0; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #003366; border-radius: 4px;">
          <p style="margin: 0; font-style: italic;">Este es un mensaje automático generado por el sistema PRL Conecta. Por favor, no responda a este correo.</p>
        </div>
      </div>
    `;

    // Realizar la petición a la función Edge usando el cliente API mejorado
    const response = await callApi({
      url: 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report',
      method: 'POST',
      data: {
        to: recipients,
        subject: 'Reporte de Incidencias PRL Conecta',
        html: generateDashboard 
          ? `${introText}<div>Generando dashboard de incidencias...</div>` // Incluir texto introductorio
          : `
            ${introText}
            <h2 style="color: #003366; margin-top: 30px;">Detalles del Reporte</h2>
            ${emailContent}
          `,
        generateDashboard: generateDashboard,
        requestId: `report-${Date.now()}`
      },
      config: {
        timeout: 15000 // Aumentar a 15 segundos para dar tiempo a generar el dashboard
      }
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Error al enviar el correo');
    }

    return { 
      success: true, 
      data: response.data,
      recipients: recipients,
      error: null
    };
  } catch (error) {
    console.error('Error al enviar reporte con Resend:', error);
    return {
      success: false,
      data: null,
      recipients: recipients,
      error: error.message || "Error desconocido"
    };
  }
}
