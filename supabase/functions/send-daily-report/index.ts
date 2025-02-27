
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper para generar el HTML de la tabla de incidencias
const generateIssuesTable = (issues: any[]) => {
  if (!issues.length) {
    return `<p style="color: #64748b; font-style: italic;">No hay incidencias pendientes.</p>`;
  }

  return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <thead>
        <tr style="background-color: #f1f5f9;">
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">ID</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Fecha</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Responsable</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Estado</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #e2e8f0;">Descripción</th>
        </tr>
      </thead>
      <tbody>
        ${issues.map(issue => {
          // Determinar el color según el estado
          let statusColor;
          switch (issue.status) {
            case 'en-estudio': statusColor = '#fbbf24'; break; // Amarillo
            case 'en-curso': statusColor = '#3b82f6'; break; // Azul
            case 'cerrada': statusColor = '#22c55e'; break; // Verde
            case 'denegado': statusColor = '#ef4444'; break; // Rojo
            default: statusColor = '#64748b'; // Gris por defecto
          }
          
          // Formato de fecha
          const date = new Date(issue.timestamp);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
          
          return `
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${issue.id}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${formattedDate}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${issue.responsable || '-'}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: ${statusColor}; color: white; font-weight: bold; font-size: 12px;">
                  ${issue.status}
                </span>
              </td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${issue.message}</td>
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
      <h3 style="color: #1e293b; margin-bottom: 15px;">Distribución por Estado</h3>
      <div style="display: flex; height: 30px; width: 100%; border-radius: 4px; overflow: hidden;">
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
      <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px;">
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #fbbf24; margin-right: 5px;"></span>
          <span>En estudio: ${counts['en-estudio'] || 0}</span>
        </div>
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #3b82f6; margin-right: 5px;"></span>
          <span>En curso: ${counts['en-curso'] || 0}</span>
        </div>
        <div style="display: flex; align-items: center; margin-right: 15px;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #22c55e; margin-right: 5px;"></span>
          <span>Cerrada: ${counts['cerrada'] || 0}</span>
        </div>
        <div style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #ef4444; margin-right: 5px;"></span>
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
      <h3 style="color: #1e293b; margin-bottom: 15px;">Top 5 Áreas con Incidencias</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${sortedAreas.map(([area, count]) => {
          const percentage = count / Object.values(areas).reduce((sum, c) => sum + c, 0) * 100;
          return `
            <tr>
              <td style="padding: 8px 0; width: 120px;">${area || 'Sin asignar'}</td>
              <td style="padding: 8px 0;">
                <div style="background-color: #e2e8f0; width: 100%; height: 20px; border-radius: 10px; overflow: hidden;">
                  <div style="background-color: #0ea5e9; height: 100%; width: ${percentage}%;"></div>
                </div>
              </td>
              <td style="padding: 8px 0; width: 50px; text-align: right; font-weight: bold;">${count}</td>
            </tr>
          `;
        }).join('')}
      </table>
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
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Informe Diario de Incidencias Pendientes</h1>
          <p style="color: #94a3b8; margin-top: 5px;">
            ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div style="padding: 30px; background-color: #f8fafc;">
          <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            Resumen de Incidencias
          </h2>
          
          <div style="margin-bottom: 15px; display: flex; justify-content: space-between; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 120px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-right: 10px; margin-bottom: 10px;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">Total Incidencias</p>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0;">${issues?.length || 0}</p>
            </div>
            <div style="flex: 1; min-width: 120px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-right: 10px; margin-bottom: 10px;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">En Estudio</p>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0; color: #fbbf24;">${statusCounts['en-estudio'] || 0}</p>
            </div>
            <div style="flex: 1; min-width: 120px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-right: 10px; margin-bottom: 10px;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">En Curso</p>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0; color: #3b82f6;">${statusCounts['en-curso'] || 0}</p>
            </div>
            <div style="flex: 1; min-width: 120px; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 10px;">
              <p style="font-size: 14px; color: #64748b; margin: 0;">Denegadas</p>
              <p style="font-size: 24px; font-weight: bold; margin: 5px 0 0; color: #ef4444;">${statusCounts['denegado'] || 0}</p>
            </div>
          </div>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">Distribución de Incidencias</h3>
            
            ${generateStatusChart(statusCounts)}
            
            ${generateAreaChart(areaCounts)}
          </div>
          
          <div style="background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">Listado de Incidencias Pendientes</h3>
            
            ${generateIssuesTable(issues || [])}
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${supabaseUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Ver en la Plataforma
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; background-color: #f1f5f9; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #64748b;">
          <p>Este es un mensaje automático del sistema de gestión de incidencias.</p>
          <p>Por favor, no responda directamente a este correo.</p>
        </div>
      </div>
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
