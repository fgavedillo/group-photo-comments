
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
    
    // Realizar la petición a la función Edge usando el cliente API mejorado
    const response = await callApi({
      url: 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report',
      method: 'POST',
      data: {
        to: recipients,
        subject: 'Reporte de Incidencias PRL Conecta',
        html: generateDashboard 
          ? '<div>Generando dashboard de incidencias...</div>' // Placeholder HTML para evitar el error
          : `
            <h1>Reporte de Incidencias</h1>
            <p>Se adjunta el reporte de incidencias pendientes.</p>
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
      recipients: recipients
    };
  } catch (error) {
    console.error('Error al enviar reporte con Resend:', error);
    throw new Error('Error al enviar el reporte: ' + (error.message || "Error desconocido"));
  }
}
