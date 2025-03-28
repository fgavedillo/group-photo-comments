
import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") || 're_2TqHgv5B_62eNDe38YRyhnXfzSjmp2ShP');

// CORS headers permitidos para las funciones de API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Recibida solicitud para enviar reporte");
    
    // Parsear el body
    const body = await req.json();
    const { filtered = false } = body;
    
    console.log(`Generando reporte ${filtered ? 'filtrado' : 'completo'}`);
    
    // Obtener todos los responsables con sus emails asignados
    // Utilizamos directamente el cliente de supabase en el edge function
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || 'https://jzmzmjvtxcrxljnhhrjo.supabase.co';
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseKey) {
      throw new Error("No se encontró la clave de Supabase");
    }
    
    // Obtener todas las incidencias pendientes
    const issuesResponse = await fetch(`${supabaseUrl}/rest/v1/issues?status=in.(en-estudio,en-curso)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (!issuesResponse.ok) {
      throw new Error(`Error al obtener las incidencias: ${await issuesResponse.text()}`);
    }
    
    const issues = await issuesResponse.json();
    console.log(`Obtenidas ${issues.length} incidencias pendientes`);
    
    if (!issues || issues.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: { successCount: 0, failureCount: 0, totalEmails: 0 },
            timestamp: new Date().toISOString(),
            message: "No hay incidencias pendientes para reportar"
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Filtrar incidencias con responsable y email asignado
    const validIssues = issues.filter((issue: any) => 
      issue.responsable && 
      issue.responsable.trim() !== '' && 
      issue.assigned_email && 
      issue.assigned_email.trim() !== ''
    );
    
    console.log(`Filtradas ${validIssues.length} incidencias con responsable y email asignado`);
    
    if (validIssues.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: { successCount: 0, failureCount: 0, totalEmails: 0 },
            timestamp: new Date().toISOString(),
            message: "No hay incidencias con responsable y email asignados para reportar"
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener emails únicos
    const uniqueEmails = [...new Set(validIssues.map((issue: any) => issue.assigned_email))].filter(Boolean);
    console.log(`Emails únicos encontrados: ${uniqueEmails.join(', ')}`);
    
    // Generar HTML para el reporte
    const reportHtml = generateReportHtml(validIssues, filtered);
    
    let successCount = 0;
    let failureCount = 0;
    
    if (filtered) {
      // Agrupar incidencias por email asignado
      const issuesByEmail: Record<string, any[]> = {};
      
      validIssues.forEach((issue: any) => {
        if (issue.assigned_email) {
          if (!issuesByEmail[issue.assigned_email]) {
            issuesByEmail[issue.assigned_email] = [];
          }
          issuesByEmail[issue.assigned_email].push(issue);
        }
      });
      
      // Enviar a cada responsable sus incidencias
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        try {
          const personalHtml = generateReportHtml(userIssues, true);
          
          console.log(`Enviando reporte personalizado a ${email}`);
          
          const result = await resend.emails.send({
            from: 'PRL Conecta <onboarding@resend.dev>',
            to: [email],
            subject: `Reporte de Incidencias Asignadas (${new Date().toLocaleDateString('es-ES')})`,
            html: personalHtml,
          });
          
          console.log(`Resultado del envío a ${email}:`, result);
          
          if (!result.error) {
            successCount++;
          } else {
            console.error(`Error al enviar a ${email}:`, result.error);
            failureCount++;
          }
        } catch (error) {
          console.error(`Error al enviar email a ${email}:`, error);
          failureCount++;
        }
      }
    } else {
      // Enviar el mismo reporte a todos
      try {
        const result = await resend.emails.send({
          from: 'PRL Conecta <onboarding@resend.dev>',
          to: uniqueEmails,
          subject: `Reporte de Incidencias (${new Date().toLocaleDateString('es-ES')})`,
          html: reportHtml,
        });
        
        console.log(`Resultado del envío global:`, result);
        
        if (!result.error) {
          successCount = uniqueEmails.length;
        } else {
          console.error(`Error al enviar reporte global:`, result.error);
          failureCount = uniqueEmails.length;
        }
      } catch (error) {
        console.error(`Error al enviar email global:`, error);
        failureCount = uniqueEmails.length;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          stats: {
            successCount,
            failureCount,
            totalEmails: successCount + failureCount
          },
          timestamp: new Date().toISOString(),
          service: "resend"
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error en la función send-resend-report:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Error desconocido al enviar el reporte",
          details: String(error)
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateReportHtml(issues: any[], isPersonalized: boolean): string {
  const date = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .header { background: #f8f9fa; padding: 20px; margin-bottom: 20px; }
          .issue { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
          .status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
          .en-estudio { background: #fff3cd; color: #856404; }
          .en-curso { background: #cce5ff; color: #004085; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Incidencias${isPersonalized ? ' Asignadas' : ''}</h1>
          <p>Fecha: ${date}</p>
        </div>
        
        ${issues.length === 0 
          ? '<p>No hay incidencias pendientes en este momento.</p>'
          : issues.map(issue => `
            <div class="issue">
              <h3>${issue.title || issue.message || 'Incidencia sin título'}</h3>
              <p><strong>Estado:</strong> <span class="status ${issue.status}">${issue.status}</span></p>
              <p><strong>Responsable:</strong> ${issue.responsable || 'No asignado'}</p>
              <p><strong>Fecha de creación:</strong> ${new Date(issue.created_at || issue.timestamp || Date.now()).toLocaleDateString('es-ES')}</p>
            </div>
          `).join('')}
      </body>
    </html>
  `;
}
