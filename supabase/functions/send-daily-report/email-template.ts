
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
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #0066cc;">
      <h1 style="color: #333; margin: 0; font-size: 24px; font-family: Arial, sans-serif;">
        ${isPersonalized ? 'Reporte de Incidencias Asignadas' : 'Reporte Diario de Incidencias'}
      </h1>
      <p style="color: #666; margin: 10px 0 0; font-family: Arial, sans-serif;">Fecha: ${report.date}</p>
      ${isPersonalized ? 
        '<p style="color: #0066cc; font-weight: bold; margin: 10px 0 0; font-family: Arial, sans-serif;">Este reporte contiene solo las incidencias pendientes asignadas a usted</p>' : 
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

  // Generate the issues by status sections with improved card styling
  const issuesSectionHtml = Object.entries(report.issues)
    .map(([status, issues]) => {
      if (issues.length === 0) return '';
      
      return `
        <div style="padding: 20px; background-color: #fff; margin-top: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
            <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${getStatusColor(status)}; margin-right: 8px;"></span>
            ${getStatusLabel(status)} <span style="color: #666; font-size: 16px; margin-left: 5px;">(${issues.length})</span>
          </h2>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 15px;">
            ${issues.map(issue => {
              // Create a direct link to the issue using the base URL
              const issueLink = `${baseUrl}/issues?id=${issue.id}`;
              
              return `
                <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px; background-color: #fafafa; transition: transform 0.2s; position: relative;">
                  <div style="position: absolute; top: 15px; right: 15px; background-color: #f0f0f0; border-radius: 15px; padding: 3px 10px; font-size: 12px; color: #666;">
                    ID: ${issue.id}
                  </div>
                  
                  <h3 style="color: #0066cc; margin-bottom: 5px; font-size: 18px;">${issue.responsable || 'Sin asignar'}</h3>
                  <p style="color: #666; margin-top: 0; font-size: 13px;">Área: ${issue.area} | Fecha: ${new Date(issue.timestamp).toLocaleDateString()}</p>
                  
                  <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 3px;">
                    <p style="margin: 0; line-height: 1.5; color: #333;">${issue.message}</p>
                  </div>
                  
                  ${issue.imageUrl ? `
                    <div style="margin: 15px 0; text-align: center;">
                      <img src="${issue.imageUrl}" alt="Imagen de la incidencia" style="max-width: 100%; height: auto; max-height: 180px; border: 1px solid #ddd; border-radius: 4px; object-fit: contain;">
                    </div>
                  ` : ''}
                  
                  ${issue.actionPlan ? `
                    <div style="margin-top: 15px;">
                      <p style="font-weight: bold; margin-bottom: 5px; color: #555; display: flex; align-items: center;">
                        <span style="display: inline-block; width: 8px; height: 8px; background-color: #4caf50; border-radius: 50%; margin-right: 8px;"></span>
                        Plan de acción:
                      </p>
                      <p style="margin-top: 0; padding: 10px; background-color: #e8f4fc; border-radius: 3px;">${issue.actionPlan}</p>
                    </div>
                  ` : ''}
                  
                  ${issue.securityImprovement ? `
                    <div style="margin-top: 15px;">
                      <p style="font-weight: bold; margin-bottom: 5px; color: #555; display: flex; align-items: center;">
                        <span style="display: inline-block; width: 8px; height: 8px; background-color: #ff9800; border-radius: 50%; margin-right: 8px;"></span>
                        Mejora de seguridad:
                      </p>
                      <p style="margin-top: 0; padding: 10px; background-color: #e8fcf4; border-radius: 3px;">${issue.securityImprovement}</p>
                    </div>
                  ` : ''}
                  
                  <div style="margin-top: 20px; text-align: center;">
                    <a href="${issueLink}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; transition: background-color 0.2s;">Ver Detalles</a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  // Generate the footer section with improved styling
  const footerHtml = `
    <div style="padding: 20px; text-align: center; background-color: #f8f9fa; color: #666; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; font-family: Arial, sans-serif;">
      <p>Este es un correo automatizado, por favor no responda a este mensaje.</p>
      <p>Para ver todas las incidencias, visite <a href="${baseUrl}/issues" style="color: #0066cc; text-decoration: underline;">el panel de incidencias</a>.</p>
      <div style="margin-top: 20px; color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} Sistema de Gestión de Incidencias</div>
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
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; background-color: #f0f2f5;">
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
