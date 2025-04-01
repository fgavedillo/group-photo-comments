
import { Resend } from 'resend';
import { Issue } from '@/types/issue';

// Usar una variable de entorno para la API key de Resend
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

if (!RESEND_API_KEY) {
  throw new Error('La API key de Resend no está configurada en las variables de entorno');
}

// Inicializar Resend con mejor manejo de errores
const resend = new Resend(RESEND_API_KEY);

/**
 * Genera el HTML para el resumen de incidencias
 */
const generateIssuesSummaryHtml = (issues: Issue[]): string => {
  const issuesList = issues
    .map(
      (issue) => {
        // Verificar si existe una URL de imagen válida
        const hasImage = issue.imageUrl && typeof issue.imageUrl === 'string' && 
                      (issue.imageUrl.startsWith('http://') || issue.imageUrl.startsWith('https://'));
        
        // Celda de imagen con tamaño consistente
        const imageCell = hasImage ? 
          `<td style="padding: 10px; border: 1px solid #ddd; text-align: center; vertical-align: middle; width: 100px;">
            <img src="${issue.imageUrl}" alt="Imagen de incidencia" 
              style="max-width: 80px; max-height: 80px; width: auto; height: auto; object-fit: contain; border-radius: 4px;" />
          </td>` : 
          `<td style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 100px;">-</td>`;
        
        return `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${issue.id}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${issue.message}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${issue.status}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${issue.area || '-'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${issue.responsable || '-'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${issue.assignedEmail || '-'}</td>
          ${imageCell}
        </tr>
      `;
      }
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
              <th style="padding: 10px; border: 1px solid #ddd;">Imagen</th>
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
 * Función auxiliar para comprobar la conexión a Internet
 */
const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.resend.com', { 
      method: 'HEAD',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Error al comprobar la conexión a Internet:', error);
    return false;
  }
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

    // Comprobar conexión a Internet
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      throw new Error('No hay conexión a Internet o el servicio Resend no está disponible');
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
      console.log('Intentando enviar email con Resend a:', uniqueEmails);
      console.log('API Key presente:', !!RESEND_API_KEY);
      console.log('API Key (primeros 5 caracteres):', RESEND_API_KEY?.substring(0, 5));
      
      // Intentar el envío con mejor diagnóstico
      const { data, error } = await resend.emails.send({
        from: 'PRLconecta <onboarding@resend.dev>', // Cambiamos el remitente a una dirección verificada
        to: uniqueEmails,
        subject: 'Resumen de Incidencias Asignadas - PRLconecta',
        html: html,
      });

      if (error) {
        console.error('Error detallado de Resend:', error);
        throw error;
      }

      console.log('Respuesta de Resend:', data);
      console.log('Email de resumen enviado correctamente a:', uniqueEmails);
    } catch (resendError) {
      console.error('Error detallado de Resend:', resendError);
      throw new Error('Error al enviar el email a través de Resend: ' + (resendError.message || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error detallado al enviar el email:', error);
    throw error instanceof Error ? error : new Error('Error desconocido al enviar el email');
  }
};
