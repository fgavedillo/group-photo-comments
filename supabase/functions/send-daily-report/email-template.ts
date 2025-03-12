
import { IssueReport, IssuesByStatus } from "./types.ts";

// Get the base URL for the application - default to a placeholder if not running on a server
const getBaseUrl = () => {
  // In production, we should use the actual domain
  return Deno.env.get("APP_URL") || "https://app.ejemplo.com";
};

export function buildEmailHtml(report: IssueReport, isPersonalized: boolean = false): string {
  const baseUrl = getBaseUrl();
  
  // Generate the header section with improved design
  const headerHtml = `
    <div style="background-color: #003366; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 4px solid #0066cc;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: Arial, sans-serif; letter-spacing: 0.5px;">
        ${isPersonalized ? 'Reporte de Incidencias Asignadas' : 'Reporte Diario de Incidencias'}
      </h1>
      <p style="color: #e0e0e0; margin: 12px 0 0; font-family: Arial, sans-serif; font-size: 16px;">Fecha: ${report.date}</p>
      ${isPersonalized ? 
        '<p style="color: #ffcc00; font-weight: bold; margin: 12px 0 0; font-family: Arial, sans-serif; background-color: rgba(255,255,255,0.1); display: inline-block; padding: 6px 12px; border-radius: 4px;">Este reporte contiene solo las incidencias pendientes asignadas a usted</p>' : 
        ''}
    </div>
  `;

  // Generate summary section with modern card design
  const summaryHtml = `
    <div style="padding: 25px; background-color: #fff; border-bottom: 1px solid #e0e0e0; font-family: Arial, sans-serif;">
      <h2 style="color: #333; margin-top: 0; border-left: 5px solid #0066cc; padding-left: 15px; font-size: 22px;">Resumen</h2>
      
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 20px;">
        <div style="background-color: #f0f7ff; border-radius: 10px; padding: 20px; min-width: 120px; text-align: center; flex: 1; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <div style="font-size: 28px; font-weight: bold; color: #0066cc;">${report.totalCount}</div>
          <div style="color: #666; font-size: 16px; margin-top: 5px;">Total</div>
        </div>
        
        ${Object.entries(report.issues).map(([status, issues]) => 
          `<div style="background-color: ${getStatusColor(status)}; border-radius: 10px; padding: 20px; min-width: 120px; text-align: center; flex: 1; box-shadow: 0 3px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 28px; font-weight: bold; color: #fff;">${issues.length}</div>
            <div style="color: #fff; font-size: 16px; margin-top: 5px;">${getStatusLabel(status)}</div>
          </div>`
        ).join('')}
      </div>
    </div>
  `;

  // Generate the issues by status sections with improved table design
  const issuesSectionHtml = Object.entries(report.issues)
    .map(([status, issues]) => {
      if (issues.length === 0) return '';
      
      return `
        <div style="padding: 25px; background-color: #fff; margin-top: 25px; border-radius: 10px; box-shadow: 0 3px 8px rgba(0,0,0,0.08); font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-top: 0; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0; display: flex; align-items: center;">
            <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: ${getStatusColor(status)}; margin-right: 10px;"></span>
            ${getStatusLabel(status)} <span style="color: #666; font-size: 18px; margin-left: 8px;">(${issues.length})</span>
          </h2>
          
          <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <thead>
              <tr style="background-color: #f8f9fa; text-align: left;">
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0; border-left: 1px solid #e0e0e0; border-top-left-radius: 8px;">ID</th>
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0;">Área</th>
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0;">Responsable</th>
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0;">Fecha</th>
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0;">Descripción</th>
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0;">Imagen</th>
                <th style="padding: 12px; border-bottom: 2px solid #e0e0e0; border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-top-right-radius: 8px;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${issues.map((issue, index) => {
                // Create a direct link to the issue using the base URL
                const issueLink = `${baseUrl}/issues?id=${issue.id}`;
                // Determine if this is the last row for border-radius styling
                const isLastRow = index === issues.length - 1;
                
                return `
                  <tr style="border-bottom: 1px solid #eee; ${index % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #ffffff;'} transition: background-color 0.2s;">
                    <td style="padding: 12px; vertical-align: top; border-left: 1px solid #e0e0e0; ${isLastRow ? 'border-bottom-left-radius: 8px; border-bottom: 1px solid #e0e0e0;' : ''}">${issue.id}</td>
                    <td style="padding: 12px; vertical-align: top; ${isLastRow ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${issue.area || '-'}</td>
                    <td style="padding: 12px; vertical-align: top; ${isLastRow ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${issue.responsable || 'Sin asignar'}</td>
                    <td style="padding: 12px; vertical-align: top; ${isLastRow ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${new Date(issue.timestamp).toLocaleDateString()}</td>
                    <td style="padding: 12px; vertical-align: top; max-width: 200px; word-wrap: break-word; ${isLastRow ? 'border-bottom: 1px solid #e0e0e0;' : ''}">${issue.message?.replace(/=20/g, '') || '-'}</td>
                    <td style="padding: 12px; vertical-align: top; text-align: center; ${isLastRow ? 'border-bottom: 1px solid #e0e0e0;' : ''}">
                      ${issue.imageUrl ? 
                        `<img src="${issue.imageUrl}" alt="Imagen de la incidencia" style="max-width: 100px; max-height: 100px; border: 1px solid #ddd; border-radius: 6px; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">` : 
                        '-'}
                    </td>
                    <td style="padding: 12px; vertical-align: top; border-right: 1px solid #e0e0e0; ${isLastRow ? 'border-bottom-right-radius: 8px; border-bottom: 1px solid #e0e0e0;' : ''}">
                      <div>
                        <a href="${issueLink}" style="display: inline-block; padding: 8px 12px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,102,204,0.2); transition: background-color 0.2s;">Ver Detalles</a>
                        
                        ${issue.actionPlan ? 
                          `<div style="margin-top: 8px; padding: 10px; background-color: #f0f7ff; border-radius: 5px; font-size: 13px; border-left: 3px solid #0066cc;">
                            <strong style="color: #0066cc;">Plan de acción:</strong> ${issue.actionPlan?.replace(/=20/g, '') || '-'}
                          </div>` : 
                          ''}
                          
                        ${issue.securityImprovement ? 
                          `<div style="margin-top: 8px; padding: 10px; background-color: #f0fff7; border-radius: 5px; font-size: 13px; border-left: 3px solid #2ecc71;">
                            <strong style="color: #2ecc71;">Mejora de seguridad:</strong> ${issue.securityImprovement?.replace(/=20/g, '') || '-'}
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
    <div style="padding: 25px; text-align: center; background-color: #003366; color: #ffffff; font-size: 14px; margin-top: 25px; border-radius: 0 0 8px 8px; border-top: 4px solid #0066cc; font-family: Arial, sans-serif;">
      <p style="margin: 0 0 10px 0;">Este es un correo automatizado del Sistema de Gestión de Incidencias.</p>
      <p style="margin: 0 0 20px 0;">Para ver todas las incidencias, visite <a href="${baseUrl}/issues" style="color: #ffcc00; text-decoration: none; border-bottom: 1px dotted #ffcc00; padding-bottom: 2px;">el panel de incidencias</a>.</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); color: #cccccc; font-size: 12px;">&copy; ${new Date().getFullYear()} Sistema de Gestión de Incidencias</div>
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
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1000px; margin: 0 auto; background-color: #f4f7fa; padding: 20px;">
      <div style="border: 1px solid #ddd; border-radius: 10px; overflow: hidden; background-color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        ${headerHtml}
        ${summaryHtml}
        ${issuesSectionHtml}
        ${footerHtml}
      </div>
      <div style="text-align: center; padding-top: 15px; font-size: 12px; color: #999;">
        <p>Si no visualiza correctamente este correo, compruebe la configuración de su cliente de correo electrónico.</p>
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
