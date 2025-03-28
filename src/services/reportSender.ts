
import { toast } from "@/hooks/use-toast";

// Usar la API key desde las variables de entorno
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || 're_2TqHgv5B_62eNDe38YRyhnXfzSjmp2ShP';

export async function sendReport(recipients: string[], reportData: any) {
  try {
    // Verificar que tenemos destinatarios
    if (!recipients || recipients.length === 0) {
      throw new Error("No se proporcionaron destinatarios para el envío del correo");
    }

    // Preparar el cuerpo del mensaje
    const emailContent = typeof reportData === 'string' 
      ? reportData 
      : `<div>${JSON.stringify(reportData, null, 2)}</div>`;

    // Realizar la petición a la API de Resend mediante la función Edge
    const response = await fetch('https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipients,
        subject: 'Reporte de Incidencias PRL Conecta',
        html: `
          <h1>Reporte de Incidencias</h1>
          <p>Se adjunta el reporte de incidencias pendientes.</p>
          ${emailContent}
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Error al enviar el correo con Resend');
    }

    return { 
      success: true, 
      data: data,
      recipients: recipients
    };
  } catch (error) {
    console.error('Error al enviar reporte con Resend:', error);
    throw new Error('Error al enviar el reporte: ' + error.message);
  }
} 
