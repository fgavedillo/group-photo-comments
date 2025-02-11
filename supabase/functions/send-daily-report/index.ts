
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);
const APP_URL = "https://incidencias.lovable.dev"; // Actualizado para usar la URL de la aplicación

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_images (
          image_url
        )
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Calculate KPI data
    const total = issues.length;
    const activeIssues = issues.filter(i => ['en-estudio', 'en-curso'].includes(i.status));
    const withImages = issues.filter(i => i.issue_images?.length > 0).length;
    
    // Group by status
    const byStatus = issues.reduce((acc: Record<string, number>, issue) => {
      const status = issue.status || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Group by area
    const byArea = issues.reduce((acc: Record<string, number>, issue) => {
      const area = issue.area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'en-curso':
          return '#FFA500';
        case 'en-estudio':
          return '#808080';
        case 'cerrada':
          return '#4CAF50';
        default:
          return '#FF0000';
      }
    };

    const today = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const issuesTable = activeIssues.map(issue => `
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
    `).join('');

    const statusDistribution = Object.entries(byStatus)
      .map(([status, count]) => ({
        status: status === 'en-estudio' ? 'En estudio' :
                status === 'en-curso' ? 'En curso' :
                status === 'cerrada' ? 'Cerrada' :
                status === 'denegado' ? 'Denegada' : status,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .map(({ status, count, percentage }) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>${status}</span>
            <span>${percentage}%</span>
          </div>
          <div style="width: 100%; height: 8px; background-color: #f3f4f6; border-radius: 4px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background-color: #3b82f6;"></div>
          </div>
        </div>
      `).join('');

    const areaDistribution = Object.entries(byArea)
      .map(([area, count]) => ({
        area,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .map(({ area, count, percentage }) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>${area}</span>
            <span>${percentage}%</span>
          </div>
          <div style="width: 100%; height: 8px; background-color: #f3f4f6; border-radius: 4px; overflow: hidden;">
            <div style="width: ${percentage}%; height: 100%; background-color: #3b82f6;"></div>
          </div>
        </div>
      `).join('');

    const emailContent = `
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
            <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${total}</p>
          </div>
          <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin: 0; color: #4a5568;">Incidencias Activas</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${activeIssues.length}</p>
          </div>
          <div style="background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="margin: 0; color: #4a5568;">Con Imágenes</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 8px 0;">${withImages}</p>
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
          <!-- Estado de Incidencias -->
          <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #2d3748; margin-top: 0;">Estado de Incidencias</h3>
            ${statusDistribution}
          </div>

          <!-- Distribución por Área -->
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

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: ["fgavedillo@gmail.com"],
      subject: `Reporte Diario de Incidencias - ${today}`,
      html: emailContent,
    });

    console.log("Daily report email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  } catch (error: any) {
    console.error("Error in send-daily-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
