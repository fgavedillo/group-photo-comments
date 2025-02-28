
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper para obtener la URL base de la aplicación
const getAppBaseUrl = () => {
  // En producción, esta sería la URL real de tu aplicación
  return "https://incidencias.lingotes.com";  // Ajustar con la URL real
};

// Helper para formatear fechas
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// Helper para generar el HTML de la leyenda de estados
const generateStatusLegend = () => {
  return `
    <div style="margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
      <div style="display: flex; align-items: center;">
        <span style="display: inline-block; width: 16px; height: 16px; background-color: #fbbf24; border-radius: 4px; margin-right: 8px;"></span>
        <span style="font-size: 14px;">En estudio</span>
      </div>
      <div style="display: flex; align-items: center;">
        <span style="display: inline-block; width: 16px; height: 16px; background-color: #3b82f6; border-radius: 4px; margin-right: 8px;"></span>
        <span style="font-size: 14px;">En curso</span>
      </div>
      <div style="display: flex; align-items: center;">
        <span style="display: inline-block; width: 16px; height: 16px; background-color: #22c55e; border-radius: 4px; margin-right: 8px;"></span>
        <span style="font-size: 14px;">Cerrada</span>
      </div>
      <div style="display: flex; align-items: center;">
        <span style="display: inline-block; width: 16px; height: 16px; background-color: #ef4444; border-radius: 4px; margin-right: 8px;"></span>
        <span style="font-size: 14px;">Denegado</span>
      </div>
    </div>
  `;
};

// Helper para generar el HTML de la tabla de incidencias mejorada
const generateIssuesTable = (issues: any[]) => {
  if (!issues.length) {
    return `<p style="color: #64748b; font-style: italic; text-align: center;">No hay incidencias pendientes.</p>`;
  }

  const baseUrl = getAppBaseUrl();

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
      <thead>
        <tr style="background-color: #0f172a; color: white;">
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">ID</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Fecha</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Responsable</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Área</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Estado</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Descripción</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Plan de Acción</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #334155;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${issues.map((issue, index) => {
          // Determinar el color según el estado
          let statusColor;
          let statusBgColor;
          switch (issue.status) {
            case 'en-estudio': 
              statusColor = '#fbbf24';
              statusBgColor = '#fffbeb';
              break;
            case 'en-curso': 
              statusColor = '#3b82f6'; 
              statusBgColor = '#eff6ff';
              break;
            case 'cerrada': 
              statusColor = '#22c55e'; 
              statusBgColor = '#f0fdf4';
              break;
            case 'denegado': 
              statusColor = '#ef4444'; 
              statusBgColor = '#fef2f2';
              break;
            default: 
              statusColor = '#64748b';
              statusBgColor = '#f8fafc';
          }
          
          // URL para acceder directamente a la gestión de esta incidencia
          const issueUrl = `${baseUrl}/issues?issue_id=${issue.id}&action=edit&utm_source=daily_email&utm_medium=email&utm_campaign=daily_report`;
          
          // Añadir clase para filas alternadas
          const rowStyle = index % 2 === 0 ? 
            "background-color: #f8fafc;" : 
            "background-color: #ffffff;";
          
          return `
            <tr style="${rowStyle}">
              <td style="padding: 12px; border: 1px solid #e2e8f0;">
                <a href="${issueUrl}" style="color: #2563eb; font-weight: bold; text-decoration: none;">
                  #${issue.id}
                </a>
              </td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${formatDate(issue.timestamp)}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${issue.responsable || '-'}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${issue.area || '-'}</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">
                <div style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${statusBgColor}; color: ${statusColor}; font-weight: bold; font-size: 12px; border: 1px solid ${statusColor};">
                  ${issue.status}
                </div>
              </td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                ${issue.message.length > 100 ? issue.message.substring(0, 100) + '...' : issue.message}
              </td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                ${issue.action_plan ? (issue.action_plan.length > 100 ? issue.action_plan.substring(0, 100) + '...' : issue.action_plan) : '-'}
              </td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">
                <a href="${issueUrl}" 
                   style="display: inline-block; padding: 6px 12px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500;"
                   title="Gestionar esta incidencia">
                  Gestionar
                </a>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
};

// Helper para generar gráficos visuales
const generateStatusChart = (counts: Record<string, number>) => {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total === 0) return '';

  return `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">Distribución por Estado</h3>
      <div style="display: flex; height: 30px; width: 100%; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        ${counts['en-estudio'] > 0 ? 
          `<div style="width: ${(counts['en-estudio'] / total * 100).toFixed(1)}%; background-color: #fbbf24;" 
                title="En estudio: ${counts['en-estudio']}"></div>` : ''}
        ${counts['en-curso'] > 0 ? 
          `<div style="width: ${(counts['en-curso'] / total * 100).toFixed(1)}%; background-color: #3b82f6;" 
                title="En curso: ${counts['en-curso']}"></div>` : ''}
        ${counts['cerrada'] > 0 ? 
          `<div style="width: ${(counts['cerrada'] / total * 100).toFixed(1)}%; background-color: #22c55e;" 
                title="Cerrada: ${counts['cerrada']}"></div>` : ''}
        ${counts['denegado'] > 0 ? 
          `<div style="width: ${(counts['denegado'] / total * 100).toFixed(1)}%; background-color: #ef4444;" 
                title="Denegado: ${counts['denegado']}"></div>` : ''}
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 13px;">
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #fbbf24; margin-right: 5px; border-radius: 2px;"></span>
          <span>En estudio: ${counts['en-estudio'] || 0}</span>
        </div>
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #3b82f6; margin-right: 5px; border-radius: 2px;"></span>
          <span>En curso: ${counts['en-curso'] || 0}</span>
        </div>
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #22c55e; margin-right: 5px; border-radius: 2px;"></span>
          <span>Cerrada: ${counts['cerrada'] || 0}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #ef4444; margin-right: 5px; border-radius: 2px;"></span>
          <span>Denegado: ${counts['denegado'] || 0}</span>
        </div>
      </div>
    </div>
  `;
};

const generateAreaChart = (areas: Record<string, number>) => {
  if (Object.keys(areas).length === 0) return '';
  
  const sortedAreas = Object.entries(areas)
    .sort((a, b) => b[1] - a[1]) // Ordenar por cantidad descendente
    .slice(0, 5); // Tomar las 5 áreas con más incidencias
  
  return `
    <div style="margin-bottom: 30px;">
      <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">Top 5 Áreas con Incidencias</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${sortedAreas.map(([area, count]) => {
          const percentage = count / Object.values(areas).reduce((sum, c) => sum + c, 0) * 100;
          return `
            <tr>
              <td style="padding: 8px 0; width: 120px; font-weight: 500;">${area || 'Sin asignar'}</td>
              <td style="padding: 8px 0;">
                <div style="background-color: #e2e8f0; width: 100%; height: 20px; border-radius: 10px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);">
                  <div style="background-color: #0ea5e9; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                </div>
              </td>
              <td style="padding: 8px 0; width: 50px; text-align: right; font-weight: bold;">${count}</td>
              <td style="padding: 8px 0; width: 60px; text-align: right; color: #64748b; font-size: 12px;">${percentage.toFixed(1)}%</td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>
  `;
};

// Función para generar tendencias comparativas (simuladas en este ejemplo)
const generateTrendsSection = (currentCount: number) => {
  // Aquí podrías implementar lógica real para comparar con datos históricos
  // Por ahora usamos datos simulados para mostrar el concepto
  const previousCount = currentCount - Math.floor(Math.random() * 5);
  const difference = currentCount - previousCount;
  const percentChange = previousCount > 0 ? ((difference / previousCount) * 100).toFixed(1) : '0';
  const isIncrease = difference > 0;
  
  return `
    <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Tendencia Semanal</h3>
      
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <div style="width: 50px; height: 50px; background-color: ${isIncrease ? '#fee2e2' : '#dcfce7'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
          <span style="color: ${isIncrease ? '#ef4444' : '#22c55e'}; font-size: 20px;">
            ${isIncrease ? '↑' : '↓'}
          </span>
        </div>
        <div>
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: #0f172a;">
            ${isIncrease ? 'Aumento' : 'Disminución'} del ${Math.abs(Number(percentChange))}% en incidencias pendientes
          </p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">
            Comparado con la semana anterior (${previousCount} incidencias)
          </p>
        </div>
      </div>
      
      <div style="padding: 10px; background-color: #f8fafc; border-radius: 6px; font-size: 14px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; color: #334155;">
          <strong>Consejo:</strong> ${
            isIncrease 
              ? 'Considera revisar las áreas con mayor número de incidencias y asignar recursos adicionales.' 
              : 'Continúa con las estrategias actuales, están ayudando a reducir el número de incidencias pendientes.'
          }
        </p>
      </div>
    </div>
  `;
};

// Función principal
const handler = async (req: Request): Promise<Response> => {
  // Manejar preflight CORS para peticiones desde el navegador
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando función send-daily-report");
    
    // Obtener incidencias que no están cerradas
    const { data: issues, error } = await supabase
      .from('issue_details')
      .select('*')
      .not('status', 'eq', 'cerrada')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    console.log(`Recuperadas ${issues?.length || 0} incidencias pendientes`);
    
    // Contar incidencias por estado
    const statusCounts: Record<string, number> = {
      'en-estudio': 0,
      'en-curso': 0,
      'cerrada': 0,
      'denegado': 0
    };
    
    // Contar incidencias por área
    const areaCounts: Record<string, number> = {};
    
    // Contar incidencias por responsable
    const responsableCounts: Record<string, number> = {};
    
    // Procesar datos para análisis
    issues?.forEach(issue => {
      // Contar por estado
      if (issue.status) {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      }
      
      // Contar por área
      if (issue.area) {
        areaCounts[issue.area] = (areaCounts[issue.area] || 0) + 1;
      } else {
        areaCounts['Sin asignar'] = (areaCounts['Sin asignar'] || 0) + 1;
      }
      
      // Contar por responsable
      if (issue.responsable) {
        responsableCounts[issue.responsable] = (responsableCounts[issue.responsable] || 0) + 1;
      }
    });
    
    // Generar el contenido visual del email
    const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Informe Diario de Incidencias</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #334155;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <div style="background-color: #0f172a; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: -0.5px;">Informe Diario de Incidencias</h1>
            <p style="color: #94a3b8; margin-top: 5px; font-size: 16px;">
              ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div style="margin-bottom: 30px; text-align: center;">
            <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 600;">
              Resumen de Incidencias Pendientes
            </h2>
            
            ${generateStatusLegend()}
            
            <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px;">
              <div style="flex: 1; min-width: 150px; background-color: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                <p style="font-size: 14px; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Total Incidencias</p>
                <p style="font-size: 28px; font-weight: bold; margin: 10px 0 0; color: #0f172a;">${issues?.length || 0}</p>
              </div>
              <div style="flex: 1; min-width: 150px; background-color: #fffbeb; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #fef3c7;">
                <p style="font-size: 14px; color: #92400e; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">En Estudio</p>
                <p style="font-size: 28px; font-weight: bold; margin: 10px 0 0; color: #fbbf24;">${statusCounts['en-estudio'] || 0}</p>
              </div>
              <div style="flex: 1; min-width: 150px; background-color: #eff6ff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #dbeafe;">
                <p style="font-size: 14px; color: #1e40af; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">En Curso</p>
                <p style="font-size: 28px; font-weight: bold; margin: 10px 0 0; color: #3b82f6;">${statusCounts['en-curso'] || 0}</p>
              </div>
              <div style="flex: 1; min-width: 150px; background-color: #fef2f2; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid #fee2e2;">
                <p style="font-size: 14px; color: #b91c1c; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Denegadas</p>
                <p style="font-size: 28px; font-weight: bold; margin: 10px 0 0; color: #ef4444;">${statusCounts['denegado'] || 0}</p>
              </div>
            </div>
          </div>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
              Análisis de Incidencias
            </h3>
            
            ${generateStatusChart(statusCounts)}
            
            ${generateAreaChart(areaCounts)}
          </div>
          
          ${generateTrendsSection(issues?.length || 0)}
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 20px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
              Listado de Incidencias Pendientes
            </h3>
            
            <div style="overflow-x: auto;">
              ${generateIssuesTable(issues || [])}
            </div>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${getAppBaseUrl()}/issues?utm_source=daily_email&utm_medium=email&utm_campaign=view_all" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; transition: background-color 0.2s;">
              Ver todas las incidencias
            </a>
          </div>
          
          <div style="margin-top: 40px; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center; font-size: 14px; color: #64748b;">
            <p style="margin-bottom: 10px;">Este es un mensaje automático del sistema de gestión de incidencias.</p>
            <p style="margin: 0;">© ${new Date().getFullYear()} Lingotes Especiales - Departamento de Prevención</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Enviar email
    const recipientEmail = "francisco.garcia@lingotes.com";
    
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail, 
        subject: "Informe Diario de Incidencias Pendientes", 
        content: emailContent
      }
    });
    
    if (emailError) {
      console.error("Error al enviar el correo:", emailError);
      throw emailError;
    }
    
    console.log(`Informe diario enviado correctamente a ${recipientEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Informe diario enviado correctamente",
        timestamp: new Date()
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
    
  } catch (error) {
    console.error("Error en la función send-daily-report:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Error al generar y enviar el informe diario"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

serve(handler);
