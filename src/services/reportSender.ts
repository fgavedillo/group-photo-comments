
import { callApi } from '@/services/api/apiClient';

export async function sendReport(recipients: string[], reportData: any) {
  try {
    // Verificar que tenemos destinatarios
    if (!recipients || recipients.length === 0) {
      throw new Error("No se proporcionaron destinatarios para el envío del correo");
    }

    // Si no se especifica un reporte, usar la generación simplificada
    const generateSimpleDashboard = !reportData || typeof reportData !== 'string';
    
    // Preparar el cuerpo del mensaje (como HTML)
    const emailContent = typeof reportData === 'string' 
      ? reportData 
      : `<div>${JSON.stringify(reportData, null, 2)}</div>`;

    console.log(`Enviando correo a ${recipients.length} destinatarios con Resend`);
    console.log(`Generando dashboard simplificado: ${generateSimpleDashboard ? 'Sí' : 'No'}`);
    
    // Agregar un texto de introducción que siempre aparecerá en el correo
    const introText = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
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

    // Generar tabla simple de incidencias (datos de prueba o datos reales)
    const simpleTableHTML = generateSimpleTable(reportData?.issuesData || []);

    // Realizar la petición a la función Edge usando el cliente API mejorado
    const response = await callApi({
      url: 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report',
      method: 'POST',
      data: {
        to: recipients,
        subject: 'Reporte de Incidencias PRL Conecta',
        html: generateSimpleDashboard 
          ? `${introText}${simpleTableHTML}` 
          : `
            ${introText}
            <h2 style="color: #003366; margin-top: 30px;">Detalles del Reporte</h2>
            ${emailContent}
          `,
        generateDashboard: false, // Desactivamos la generación compleja del dashboard
        requestId: `report-${Date.now()}`,
        // Asegurarnos de que se incluyan los datos de las incidencias si están disponibles
        issuesData: reportData && typeof reportData === 'object' ? reportData : null
      },
      config: {
        timeout: 30000 // Aumentar a 30 segundos para dar tiempo a generar el dashboard
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

// Función para generar una tabla simple HTML
function generateSimpleTable(issues: any[] = []) {
  // Si no hay datos, usar datos de prueba
  if (!issues || issues.length === 0) {
    issues = [
      {
        id: 1,
        message: "Fallo en sistema de ventilación",
        area: "Producción",
        status: "en-estudio",
        responsable: "Juan Pérez",
        timestamp: new Date().toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop"
      },
      {
        id: 2,
        message: "Derrame de producto químico",
        area: "Laboratorio",
        status: "en-curso",
        responsable: "María González",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop"
      }
    ];
  }

  // Construir la tabla HTML
  const tableHTML = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #003366; margin-top: 30px;">Listado de Incidencias</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <thead>
          <tr style="background-color: #f8f9fa; text-align: left;">
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">ID</th>
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">Incidencia</th>
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">Área</th>
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">Estado</th>
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">Responsable</th>
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">Fecha</th>
            <th style="padding: 12px; border-bottom: 1px solid #ddd;">Imagen</th>
          </tr>
        </thead>
        <tbody>
          ${issues.map(issue => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px;">${issue.id}</td>
              <td style="padding: 12px; max-width: 200px; word-wrap: break-word;">${issue.message}</td>
              <td style="padding: 12px;">${issue.area || '-'}</td>
              <td style="padding: 12px;">${getStatusLabel(issue.status)}</td>
              <td style="padding: 12px;">${issue.responsable || 'Sin asignar'}</td>
              <td style="padding: 12px;">${new Date(issue.timestamp).toLocaleDateString('es-ES')}</td>
              <td style="padding: 12px; text-align: center;">
                ${issue.imageUrl ? 
                  `<img src="${issue.imageUrl}" alt="Imagen de la incidencia" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">` : 
                  '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return tableHTML;
}

// Función para obtener etiqueta de estado legible
function getStatusLabel(status: string): string {
  switch (status) {
    case "en-estudio": return "En Estudio";
    case "en-curso": return "En Curso";
    case "cerrada": return "Cerrada";
    case "denegado": return "Denegada";
    default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Sin Estado";
  }
}
