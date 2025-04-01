
import { Resend } from 'resend';
import { Issue } from '@/types/issue';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

if (!RESEND_API_KEY) {
  throw new Error('La API key de Resend no está configurada en las variables de entorno');
}

const resend = new Resend(RESEND_API_KEY);

/**
 * Genera el HTML para el resumen de incidencias
 */
const generateIssuesSummaryHtml = (issues: Issue[]): string => {
  const issuesList = issues
    .map(
      (issue) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.id}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.message}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.status}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.area || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.responsable || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.assignedEmail || '-'}</td>
      </tr>
    `
    )
    .join('');

  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>Resumen de Incidencias Asignadas</h1>
        <p>Este es un resumen de las incidencias que están actualmente en estudio o en curso y requieren su atención:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Descripción</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Estado</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Área</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Responsable</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Email Asignado</th>
            </tr>
          </thead>
          <tbody>
            ${issuesList}
          </tbody>
        </table>
        
        <p style="margin-top: 20px; color: #666;">
          Este es un email automático del sistema de gestión de incidencias de PRLconecta.
          Por favor, no responda a este email.
        </p>
      </body>
    </html>
  `;
};

/**
 * Envía un resumen de las incidencias abiertas por email a los responsables asignados
 * @param issues - Lista de incidencias a incluir en el resumen
 */
export const sendIssuesSummary = async (issues: Issue[]): Promise<void> => {
  try {
    if (!Array.isArray(issues)) {
      throw new Error('El parámetro issues debe ser un array');
    }

    // Validar que hay incidencias
    if (issues.length === 0) {
      throw new Error('No hay incidencias para enviar');
    }

    // Obtener emails únicos de las incidencias
    const uniqueEmails = [...new Set(issues
      .map(issue => issue.assignedEmail)
      .filter(email => email && email.includes('@')))];

    if (uniqueEmails.length === 0) {
      throw new Error('No hay destinatarios válidos para enviar el resumen. Asegúrese de que las incidencias tienen emails asignados.');
    }

    const html = generateIssuesSummaryHtml(issues);

    try {
      const { data, error } = await resend.emails.send({
        from: 'PRLconecta <team@prlconecta.es>',
        to: uniqueEmails,
        subject: 'Resumen de Incidencias Asignadas - PRLconecta',
        html: html,
      });

      if (error) {
        throw error;
      }

      console.log('Email de resumen enviado correctamente a:', uniqueEmails);
    } catch (resendError) {
      console.error('Error de Resend:', resendError);
      throw new Error('Error al enviar el email a través de Resend');
    }
  } catch (error) {
    console.error('Error detallado al enviar el email:', error);
    throw error instanceof Error ? error : new Error('Error desconocido al enviar el email');
  }
};
