
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
      <h1 style="color: #333; margin: 0; font-size: 24px;">
        ${isPersonalized ? 'Reporte de Incidencias Asignadas' : 'Reporte Diario de Incidencias'}
      </h1>
      <p style="color: #666; margin: 10px 0 0;">Fecha: ${report.date}</p>
      ${isPersonalized ? 
        '<p style="color: #0066cc; font-weight: bold; margin: 10px 0 0;">Este reporte contiene solo las incidencias pendientes asignadas a usted</p>' : 
        ''}
    </div>
  `;

  // Generate summary section
  const summaryHtml = `
    <div style="padding: 20px; background-color: #fff; border-bottom: 1px solid #eee;">
      <h2 style="color: #333; margin-top: 0;">Resumen</h2>
      <p style="margin-bottom: 5px;"><strong>Total de incidencias:</strong> ${report.totalCount}</p>
      ${Object.entries(report.issues).map(([status, issues]) => 
        `<p style="margin-bottom: 5px;"><strong>${getStatusLabel(status)}:</strong> ${issues.length}</p>`
      ).join('')}
    </div>
  `;

  // Generate the issues by status sections
  const issuesSectionHtml = Object.entries(report.issues)
    .map(([status, issues]) => {
      if (issues.length === 0) return '';
      
      return `
        <div style="padding: 20px; background-color: #fff; margin-top: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            ${getStatusLabel(status)} (${issues.length})
          </h2>
          <div>
            ${issues.map(issue => {
              // Create a direct link to the issue using the base URL
              const issueLink = `${baseUrl}/issues?id=${issue.id}`;
              
              return `
                <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                  <h3 style="color: #0066cc; margin-bottom: 5px;">${issue.responsable || 'Sin asignar'}</h3>
                  <p style="color: #666; margin-top: 0; font-size: 14px;">ID: ${issue.id} | Área: ${issue.area} | Fecha: ${new Date(issue.timestamp).toLocaleDateString()}</p>
                  
                  <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc; border-radius: 3px;">
                    <p style="margin: 0; line-height: 1.5;">${issue.message}</p>
                  </div>
                  
                  ${issue.imageUrl ? `
                    <div style="margin: 15px 0;">
                      <img src="${issue.imageUrl}" alt="Imagen de la incidencia" style="max-width: 100%; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                  ` : ''}
                  
                  ${issue.actionPlan ? `
                    <div style="margin-top: 15px;">
                      <p style="font-weight: bold; margin-bottom: 5px;">Plan de acción:</p>
                      <p style="margin-top: 0; padding: 10px; background-color: #e8f4fc; border-radius: 3px;">${issue.actionPlan}</p>
                    </div>
                  ` : ''}
                  
                  ${issue.securityImprovement ? `
                    <div style="margin-top: 15px;">
                      <p style="font-weight: bold; margin-bottom: 5px;">Mejora de seguridad:</p>
                      <p style="margin-top: 0; padding: 10px; background-color: #e8fcf4; border-radius: 3px;">${issue.securityImprovement}</p>
                    </div>
                  ` : ''}
                  
                  <div style="margin-top: 15px;">
                    <a href="${issueLink}" style="display: inline-block; padding: 8px 15px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver Detalles</a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  // Generate the footer section
  const footerHtml = `
    <div style="padding: 20px; text-align: center; background-color: #f8f9fa; color: #666; font-size: 14px; margin-top: 20px;">
      <p>Este es un correo automatizado, por favor no responda a este mensaje.</p>
      <p>Para ver todas las incidencias, visite <a href="${baseUrl}/issues" style="color: #0066cc; text-decoration: underline;">el panel de incidencias</a>.</p>
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
      <div style="border: 1px solid #ddd; border-radius: 5px; overflow: hidden; background-color: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
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
