
import { toast } from "@/hooks/use-toast";

export async function sendReport(recipients: string[], reportData: any) {
  try {
    // Verificar que tenemos destinatarios
    if (!recipients || recipients.length === 0) {
      throw new Error("No se proporcionaron destinatarios para el envío del correo");
    }

    // Preparar el cuerpo del mensaje (como HTML)
    const emailContent = typeof reportData === 'string' 
      ? reportData 
      : `<div>${JSON.stringify(reportData, null, 2)}</div>`;

    console.log(`Enviando correo a ${recipients.length} destinatarios con Resend`);
    
    // Realizar la petición a la función Edge de Supabase
    const response = await fetch('https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en respuesta de Resend:', errorText);
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // Si no es JSON, usar el texto completo
        errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return { 
      success: true, 
      data: data,
      recipients: recipients
    };
  } catch (error) {
    console.error('Error al enviar reporte con Resend:', error);
    throw new Error('Error al enviar el reporte: ' + (error.message || "Error desconocido"));
  }
}
