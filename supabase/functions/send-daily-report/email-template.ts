
import { Issue, KPIData, DistributionData } from "./types.ts";
import { getStatusColor, formatDate } from "./utils.ts";

const generateIssueRow = (issue: Issue): string => `
  <tr style="border-bottom: 1px solid #eee;">
    <td style="padding: 12px;">
      <a href="${APP_URL}/?issue_id=${issue.id}&action=edit" style="color: #3b82f6; text-decoration: underline;">
        ${issue.id}
      </a>
    </td>
    <td style="padding: 12px;">
      <a href="${APP_URL}/?issue_id=${issue.id}&action=edit" style="color: #3b82f6; text-decoration: none;">
        ${issue.message}
      </a>
    </td>
    <td style="padding: 12px;">${issue.security_improvement || '-'}</td>
    <td style="padding: 12px;">
      <span style="
        background-color: ${getStatusColor(issue.status)};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
      ">
        ${issue.status}
      </span>
    </td>
    <td style="padding: 12px;">${issue.area || '-'}</td>
    <td style="padding: 12px;">${issue.responsable || '-'}</td>
    <td style="padding: 12px;">
      ${issue.issue_images?.[0]?.image_url ? 
        `<img src="${issue.issue_images[0].image_url}" 
              alt="Incidencia" 
              style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"
        />` : 
        '-'
      }
    </td>
  </tr>
`;

const generateDistributionSection = (data: Record<string, number>, total: number): string => {
  return Object.entries(data)
    .map(([key, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>${key}</span>
            <span>${percentage}%</span>
          </div>
          <div style="width: 100%; height: 8px; background-color: #f3f4f6; border-radius: 4px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background-color: #3b82f6;"></div>
          </div>
        </div>
      `;
    })
    .join('');
};

export const generateEmailContent = (
  issues: Issue[],
  kpis: KPIData,
  distribution: DistributionData
): string => {
  const today = formatDate();
  const issuesTable = kpis.activeIssues.map(generateIssueRow).join('');
  const statusDistribution = generateDistributionSection(distribution.byStatus, kpis.total);
  const areaDistribution = generateDistributionSection(distribution.byArea, kpis.total);

  return `
    <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #333;">Reporte Diario de Incidencias</h1>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #2c5282; margin-top: 0;">Buenos días,</h2>
        <p style="color: #4a5568; line-height: 1.6;">
          A continuación encontrará el reporte diario de incidencias correspondiente al ${today}. 
          Este informe incluye todas las incidencias activas y sus indicadores clave.
        </p>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0; color: #4a5568;">Total Incidencias</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${kpis.total}</p>
        </div>
        <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0; color: #4a5568;">Incidencias Activas</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${kpis.activeIssues.length}</p>
        </div>
        <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin: 0; color: #4a5568;">Con Imágenes</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${kpis.withImages}</p>
        </div>
      </div>
      
      <h2 style="color: #2d3748; margin-top: 32px;">Incidencias Activas</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 12px; text-align: left;">ID</th>
            <th style="padding: 12px; text-align: left;">Descripción</th>
            <th style="padding: 12px; text-align: left;">Mejora de Seguridad</th>
            <th style="padding: 12px; text-align: left;">Estado</th>
            <th style="padding: 12px; text-align: left;">Área</th>
            <th style="padding: 12px; text-align: left;">Responsable</th>
            <th style="padding: 12px; text-align: left;">Imagen</th>
          </tr>
        </thead>
        <tbody>
          ${issuesTable}
        </tbody>
      </table>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px;">
        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="color: #2d3748; margin-top: 0;">Estado de Incidencias</h3>
          ${statusDistribution}
        </div>

        <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="color: #2d3748; margin-top: 0;">Distribución por Área</h3>
          ${areaDistribution}
        </div>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 0.9em;">
          Este es un mensaje automático enviado a las 9:00 AM. 
          Por favor, no responda a este correo.
        </p>
      </div>
    </div>
  `;
};
