import { Resend } from 'resend';

const resend = new Resend('re_M2FFkWg5_5fy9uyFfxrdb9ExipW7kDJe8');

export async function sendReport(recipients: string[], reportData: any) {
  try {
    const response = await resend.emails.send({
      from: 'PRL Conecta <onboarding@resend.dev>',
      to: recipients,
      subject: 'Reporte de Incidencias PRL Conecta',
      html: `
        <h1>Reporte de Incidencias</h1>
        <p>Se adjunta el reporte de incidencias pendientes.</p>
        <div>
          ${JSON.stringify(reportData, null, 2)}
        </div>
      `,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return { success: true, data: response };
  } catch (error) {
    console.error('Error al enviar reporte:', error);
    throw new Error('Error al enviar el reporte: ' + error.message);
  }
} 