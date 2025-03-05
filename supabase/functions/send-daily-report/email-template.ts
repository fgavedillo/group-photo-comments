
import { IssueReport, IssuesByStatus } from "./types.ts";

// Get the base URL for the application - default to a placeholder if not running on a server
const getBaseUrl = () => {
  // In production, we should use the actual domain
  return Deno.env.get("APP_URL") || "https://app.ejemplo.com";
};

export function buildEmailHtml(report: IssueReport, isPersonalized: boolean = false): string {
  const baseUrl = getBaseUrl();
  
  // Generate the header section
  const headerHtml = `
    <div style="background-color: #003366; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">
        ${isPersonalized ? 'Reporte de Incidencias Asignadas' : 'Reporte Diario de Incidencias'}
      </h1>
      <p style="color: #cccccc; margin: 10px 0 0; font-family: Arial, sans-serif;">Fecha: ${report.date}</p>
      ${isPersonalized ? 
        '<p style="color: #ffcc00; font-weight: bold; margin: 10px 0 0; font-family: Arial, sans-serif;">Este reporte contiene solo las incidencias pendientes asignadas a usted</p>' : 
        ''}
    </div>
  `;

  // Generate summary section with improved styling
  const summaryHtml = `
    <div style="padding: 20px; background-color: #fff; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">
      <h2 style="color: #333; margin-top: 0; border-left: 4px solid #0066cc; padding-left: 10px;">Resumen</h2>
      
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px;">
        <div style="background-color: #f0f7ff; border-radius: 8px; padding: 15px; min-width: 120px; text-align: center; flex: 1;">
          <div style="font-size: 24px; font-weight: bold; color: #0066cc;">${report.totalCount}</div>
          <div style="color: #666; font-size: 14px;">Total</div>
        </div>
        
        ${Object.entries(report.issues).map(([status, issues]) => 
          `<div style="background-color: ${getStatusColor(status)}; border-radius: 8px; padding: 15px; min-width: 120px; text-align: center; flex: 1;">
            <div style="font-size: 24px; font-weight: bold; color: #fff;">${issues.length}</div>
            <div style="color: #fff; font-size: 14px;">${getStatusLabel(status)}</div>
          </div>`
        ).join('')}
      </div>
    </div>
  `;

  // Generate the issues by status sections with table-based styling and smaller images
  const issuesSectionHtml = Object.entries(report.issues)
    .map(([status, issues]) => {
      if (issues.length === 0) return '';
      
      return `
        <div style="padding: 20px; background-color: #fff; margin-top: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${getStatusColor(status)}; margin-right: 8px;"></span>
            ${getStatusLabel(status)} <span style="color: #666; font-size: 16px; margin-left: 5px;">(${issues.length})</span>
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8f9fa; text-align: left;">
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">ID</th>
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">Área</th>
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">Responsable</th>
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">Fecha</th>
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">Descripción</th>
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">Imagen</th>
                <th style="padding: 10px; border-bottom: 1px solid #ddd;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map(issue => {
                // Create a direct link to the issue using the base URL
                const issueLink = `${baseUrl}/issues?id=${issue.id}`;
                
                return `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; vertical-align: top;">${issue.id}</td>
                    <td style="padding: 10px; vertical-align: top;">${issue.area || '-'}</td>
                    <td style="padding: 10px; vertical-align: top;">${issue.responsable || 'Sin asignar'}</td>
                    <td style="padding: 10px; vertical-align: top;">${new Date(issue.timestamp).toLocaleDateString()}</td>
                    <td style="padding: 10px; vertical-align: top; max-width: 200px; word-wrap: break-word;">${issue.message?.replace(/=20/g, '') || '-'}</td>
                    <td style="padding: 10px; vertical-align: top; text-align: center;">
                      ${issue.imageUrl ? 
                        `<img src="${issue.imageUrl}" alt="Imagen de la incidencia" style="max-width: 80px; max-height: 80px; border: 1px solid #ddd; border-radius: 4px; object-fit: cover;">` : 
                        '-'}
                    </td>
                    <td style="padding: 10px; vertical-align: top;">
                      <div>
                        <a href="${issueLink}" style="display: inline-block; padding: 5px 10px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; margin-bottom: 5px;">Ver Detalles</a>
                        
                        ${issue.actionPlan ? 
                          `<div style="margin-top: 5px; padding: 5px; background-color: #f0f7ff; border-radius: 3px; font-size: 12px;">
                            <strong>Plan de acción:</strong> ${issue.actionPlan?.replace(/=20/g, '') || '-'}
                          </div>` : 
                          ''}
                          
                        ${issue.securityImprovement ? 
                          `<div style="margin-top: 5px; padding: 5px; background-color: #f0fff7; border-radius: 3px; font-size: 12px;">
                            <strong>Mejora de seguridad:</strong> ${issue.securityImprovement?.replace(/=20/g, '') || '-'}
                          </div>` : 
                          ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  // Generate the footer section with improved styling
  const footerHtml = `
    <div style="padding: 20px; text-align: center; background-color: #003366; color: #ffffff; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; font-family: Arial, sans-serif;">
      <p>Este es un correo automatizado del Sistema de Gestión de Incidencias.</p>
      <p>Para ver todas las incidencias, visite <a href="${baseUrl}/issues" style="color: #ffcc00; text-decoration: underline;">el panel de incidencias</a>.</p>
      <div style="margin-top: 20px; color: #cccccc; font-size: 12px;">&copy; ${new Date().getFullYear()} Sistema de Gestión de Incidencias</div>
    </div>
  `;

  // Combine all sections
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isPersonalized ? 'Reporte de Incidencias Asignadas' : 'Reporte Diario de Incidencias'}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; background-color: #f0f2f5;">
      <div style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        ${headerHtml}
        ${summaryHtml}
        ${issuesSectionHtml}
        ${footerHtml}
      </div>
    </body>
    </html>
  `;
}

// Helper function to get a human-readable status label
function getStatusLabel(status: string): string {
  switch (status) {
    case "en-estudio":
      return "En Estudio";
    case "en-curso":
      return "En Curso";
    case "cerrada":
      return "Cerradas";
    case "denegado":
      return "Denegadas";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Helper function to get color for status
function getStatusColor(status: string): string {
  switch (status) {
    case "en-estudio":
      return "#3498db"; // Azul
    case "en-curso":
      return "#f39c12"; // Naranja
    case "cerrada":
      return "#2ecc71"; // Verde
    case "denegado":
      return "#e74c3c"; // Rojo
    default:
      return "#95a5a6"; // Gris
  }
}
