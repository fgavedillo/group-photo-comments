
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

    // Obtener datos de incidencias para el reporte
    let issuesData = [];
    
    // Si se proporcionan datos en reportData, usarlos
    if (reportData && reportData.issuesData) {
      issuesData = reportData.issuesData;
    }
    
    // Obtener las incidencias desde el hook useIssues si está disponible
    // en lugar de cargar datos mock
    try {
      // Importar useIssues de forma dinámica
      const { useIssues } = await import('@/hooks/useIssues');
      const { issues } = useIssues();
      
      // Si hay incidencias reales, usarlas
      if (issues && issues.length > 0) {
        console.log(`Usando ${issues.length} incidencias reales para el reporte`);
        issuesData = issues;
      }
    } catch (err) {
      console.log('No se pudo cargar useIssues, usando datos proporcionados:', err);
    }
    
    // Generar resumen del dashboard
    const dashboardSummaryHTML = generateDashboardSummary(issuesData || []);
    
    // Generar tabla simple de incidencias
    const simpleTableHTML = generateSimpleTable(issuesData || []);

    // Realizar la petición a la función Edge usando el cliente API mejorado
    const response = await callApi({
      url: 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-resend-report',
      method: 'POST',
      data: {
        to: recipients,
        subject: 'Reporte de Incidencias PRL Conecta',
        html: generateSimpleDashboard 
          ? `${introText}${dashboardSummaryHTML}${simpleTableHTML}` 
          : `
            ${introText}
            ${dashboardSummaryHTML}
            <h2 style="color: #003366; margin-top: 30px;">Detalles del Reporte</h2>
            ${emailContent}
          `,
        generateDashboard: false, // Desactivamos la generación compleja del dashboard
        requestId: `report-${Date.now()}`,
        // Asegurarnos de que se incluyan los datos de las incidencias si están disponibles
        issuesData: issuesData.length > 0 ? issuesData : reportData
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

// Función para generar un resumen del dashboard
function generateDashboardSummary(issues: any[] = []) {
  if (!issues || issues.length === 0) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #003366; margin-top: 30px;">Resumen del Dashboard</h2>
        <p>No hay incidencias disponibles para generar un resumen en este momento.</p>
      </div>
    `;
  }
  
  // Contar incidencias por estado
  const statusCount = issues.reduce((acc: any, issue: any) => {
    const status = issue.status || 'sin-estado';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Contar incidencias por área
  const areaCount = issues.reduce((acc: any, issue: any) => {
    const area = issue.area || 'Sin asignar';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  
  // Cantidad de incidencias con y sin responsable
  const withResponsible = issues.filter(issue => issue.responsable && issue.responsable.trim() !== '').length;
  const withoutResponsible = issues.length - withResponsible;
  
  // Generar HTML para el resumen
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #003366; margin-top: 10px;">Resumen del Dashboard</h2>
      
      <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; min-width: 200px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #e9ecef;">
          <h3 style="color: #003366; margin-top: 0;">Estado de Incidencias</h3>
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Total:</span>
              <strong>${issues.length}</strong>
            </div>
            ${Object.entries(statusCount).map(([status, count]) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${getStatusLabel(status)}:</span>
                <strong>${count}</strong>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="flex: 1; min-width: 200px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #e9ecef;">
          <h3 style="color: #003366; margin-top: 0;">Responsabilidad</h3>
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Con responsable:</span>
              <strong>${withResponsible}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Sin responsable:</span>
              <strong>${withoutResponsible}</strong>
            </div>
          </div>
        </div>
        
        <div style="flex: 1; min-width: 200px; background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #e9ecef;">
          <h3 style="color: #003366; margin-top: 0;">Distribución por Área</h3>
          <div style="margin-top: 10px;">
            ${Object.entries(areaCount).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([area, count]) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>${area}:</span>
                <strong>${count}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div style="background-color: #e9f7fe; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; margin-bottom: 20px;">
        <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 10px;">Estadísticas Importantes</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Promedio de incidencias por área: ${(issues.length / Object.keys(areaCount).length).toFixed(1)}</li>
          <li>Porcentaje de incidencias con responsable: ${(withResponsible / issues.length * 100).toFixed(1)}%</li>
          <li>Estado más común: ${getMaxStatus(statusCount)}</li>
        </ul>
      </div>
    </div>
  `;
}

// Función para obtener el estado más común
function getMaxStatus(statusCount: Record<string, number>): string {
  if (Object.keys(statusCount).length === 0) return "Sin datos";
  
  const maxEntry = Object.entries(statusCount).reduce((max, current) => 
    current[1] > max[1] ? current : max, ["", 0]);
  
  return `${getStatusLabel(maxEntry[0])} (${maxEntry[1]})`;
}

// Función para generar una tabla simple HTML
function generateSimpleTable(issues: any[] = []) {
  // Si no hay datos, usar solo un mensaje indicativo
  if (!issues || issues.length === 0) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto;">
        <h2 style="color: #003366; margin-top: 30px;">Listado de Incidencias</h2>
        <p>No hay incidencias disponibles para mostrar en este momento.</p>
      </div>
    `;
  }
  
  // Procesar las incidencias para asegurar que cada una tenga la URL de imagen correcta
  const processedIssues = issues.map(issue => {
    // Crear una copia del issue para no modificar el original
    const processedIssue = { ...issue };
    
    // 1. Si ya tiene imageUrl definida, la mantenemos
    if (processedIssue.imageUrl) {
      return processedIssue;
    }
    
    // 2. Si tiene image_url (campo directo de la base de datos), la usamos
    if (processedIssue.image_url) {
      processedIssue.imageUrl = processedIssue.image_url;
      return processedIssue;
    }
    
    // 3. Si tiene issue_images (relación con la tabla de imágenes), usamos la primera
    if (processedIssue.issue_images && Array.isArray(processedIssue.issue_images) && processedIssue.issue_images.length > 0) {
      processedIssue.imageUrl = processedIssue.issue_images[0].image_url;
      return processedIssue;
    }
    
    // Si llegamos aquí, la incidencia no tiene imagen asociada
    return processedIssue;
  });

  // Construir la tabla HTML con las incidencias procesadas
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
          ${processedIssues.map(issue => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px;">${issue.id}</td>
              <td style="padding: 12px; max-width: 200px; word-wrap: break-word;">${issue.message}</td>
              <td style="padding: 12px;">${issue.area || '-'}</td>
              <td style="padding: 12px;">${getStatusLabel(issue.status)}</td>
              <td style="padding: 12px;">${issue.responsable || 'Sin asignar'}</td>
              <td style="padding: 12px;">${issue.timestamp instanceof Date ? issue.timestamp.toLocaleDateString('es-ES') : new Date(issue.timestamp).toLocaleDateString('es-ES')}</td>
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
