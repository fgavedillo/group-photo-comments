
// @ts-ignore: Resend types
import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders, handleCors } from "./cors.ts";

// Obtener la API key de Resend de las variables de entorno
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

// Inicializar el cliente de Resend
const resend = new Resend(resendApiKey);

// Interfaz para la solicitud de reporte
interface ReportRequest {
  filtered?: boolean;
  to?: string[];
  subject?: string;
  html?: string;
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Solicitud recibida: ${req.method}`);
  
  // Manejar CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) {
    console.log(`[${new Date().toISOString()}] Respondiendo a solicitud preflight CORS`);
    return corsResponse;
  }

  try {
    // Verificar si la API key está configurada
    if (!resendApiKey) {
      console.error("Error: API key de Resend no configurada");
      throw new Error("La API key de Resend no está configurada. Contacte al administrador.");
    }

    // Solo permitir solicitudes POST
    if (req.method !== "POST") {
      console.error(`Método no permitido: ${req.method}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Método no permitido" }
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Obtener y validar el cuerpo de la solicitud
    const requestData: ReportRequest = await req.json().catch((error) => {
      console.error("Error al parsear JSON:", error);
      throw new Error("Formato de solicitud inválido");
    });

    console.log(`[${new Date().toISOString()}] Datos de solicitud:`, JSON.stringify(requestData));

    // Obtener todas las incidencias pendientes usando Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseKey) {
      throw new Error("No se encontró la clave de Supabase");
    }

    const filtered = requestData.filtered || false;
    console.log(`[${new Date().toISOString()}] Tipo de reporte: ${filtered ? 'Filtrado' : 'Completo'}`);

    // Si se proporcionan to, subject y html directamente, enviar ese email
    if (requestData.to && requestData.subject && requestData.html) {
      console.log(`[${new Date().toISOString()}] Enviando email directo a ${requestData.to.join(', ')}`);
      
      const result = await resend.emails.send({
        from: 'PRL Conecta <onboarding@resend.dev>',
        to: requestData.to,
        subject: requestData.subject,
        html: requestData.html,
      });
      
      console.log(`[${new Date().toISOString()}] Resultado de envío directo:`, result);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: { 
              successCount: requestData.to.length,
              failureCount: 0,
              totalEmails: requestData.to.length
            },
            timestamp: new Date().toISOString(),
            result
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener incidencias pendientes
    console.log(`[${new Date().toISOString()}] Consultando incidencias pendientes`);
    const issuesResponse = await fetch(`${supabaseUrl}/rest/v1/issues?status=in.(en-estudio,en-curso)&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (!issuesResponse.ok) {
      const errorText = await issuesResponse.text();
      console.error(`[${new Date().toISOString()}] Error al obtener incidencias:`, errorText);
      throw new Error(`Error al obtener incidencias: ${errorText}`);
    }
    
    const issues = await issuesResponse.json();
    console.log(`[${new Date().toISOString()}] Obtenidas ${issues.length} incidencias pendientes`);
    
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
    
    console.log(`[${new Date().toISOString()}] Filtradas ${validIssues.length} incidencias con responsable y email asignado`);
    
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
    const uniqueEmails = [...new Set(validIssues.map((issue: any) => issue.assigned_email.trim()))].filter(Boolean);
    console.log(`[${new Date().toISOString()}] Emails únicos encontrados: ${uniqueEmails.join(', ')}`);
    
    if (uniqueEmails.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: { successCount: 0, failureCount: 0, totalEmails: 0 },
            timestamp: new Date().toISOString(),
            message: "No hay emails válidos para enviar el reporte"
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generar HTML para el reporte
    const reportHtml = generateReportHtml(validIssues, filtered);
    
    let successCount = 0;
    let failureCount = 0;
    let results = [];
    
    if (filtered) {
      // Agrupar incidencias por email asignado
      const issuesByEmail: Record<string, any[]> = {};
      
      validIssues.forEach((issue: any) => {
        if (issue.assigned_email) {
          const email = issue.assigned_email.trim();
          if (email && !issuesByEmail[email]) {
            issuesByEmail[email] = [];
          }
          if (email) {
            issuesByEmail[email].push(issue);
          }
        }
      });
      
      // Enviar a cada responsable sus incidencias
      for (const [email, userIssues] of Object.entries(issuesByEmail)) {
        try {
          console.log(`[${new Date().toISOString()}] Generando reporte personalizado para ${email}`);
          const personalHtml = generateReportHtml(userIssues, true);
          
          console.log(`[${new Date().toISOString()}] Enviando reporte personalizado a ${email}`);
          
          const result = await resend.emails.send({
            from: 'PRL Conecta <onboarding@resend.dev>',
            to: [email],
            subject: `Reporte de Incidencias Asignadas (${new Date().toLocaleDateString('es-ES')})`,
            html: personalHtml,
          });
          
          console.log(`[${new Date().toISOString()}] Resultado del envío a ${email}:`, result);
          results.push(result);
          
          if (!result.error) {
            successCount++;
          } else {
            console.error(`[${new Date().toISOString()}] Error al enviar a ${email}:`, result.error);
            failureCount++;
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error al enviar email a ${email}:`, error);
          failureCount++;
        }
      }
    } else {
      // Enviar el mismo reporte a todos
      try {
        console.log(`[${new Date().toISOString()}] Enviando reporte completo a ${uniqueEmails.length} destinatarios`);
        
        const result = await resend.emails.send({
          from: 'PRL Conecta <onboarding@resend.dev>',
          to: uniqueEmails,
          subject: `Reporte de Incidencias (${new Date().toLocaleDateString('es-ES')})`,
          html: reportHtml,
        });
        
        console.log(`[${new Date().toISOString()}] Resultado del envío global:`, result);
        results.push(result);
        
        if (!result.error) {
          successCount = uniqueEmails.length;
        } else {
          console.error(`[${new Date().toISOString()}] Error al enviar reporte global:`, result.error);
          failureCount = uniqueEmails.length;
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error al enviar email global:`, error);
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
          service: "resend",
          results
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error en la función send-resend-report:`, error);
    
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
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #f8f9fa; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
          .issue { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
          .status { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
          .en-estudio { background: #fff3cd; color: #856404; }
          .en-curso { background: #cce5ff; color: #004085; }
          .footer { margin-top: 30px; font-size: 12px; color: #6c757d; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reporte de Incidencias${isPersonalized ? ' Asignadas' : ''}</h1>
          <p>Fecha: ${date}</p>
          ${isPersonalized ? '<p><strong>Este reporte contiene las incidencias asignadas específicamente a usted.</strong></p>' : ''}
        </div>
        
        ${issues.length === 0 
          ? '<p>No hay incidencias pendientes en este momento.</p>'
          : issues.map((issue: any) => `
            <div class="issue">
              <h3>${issue.message || 'Incidencia sin título'}</h3>
              <p><strong>Estado:</strong> <span class="status ${issue.status}">${issue.status}</span></p>
              <p><strong>Responsable:</strong> ${issue.responsable || 'No asignado'}</p>
              <p><strong>Área:</strong> ${issue.area || 'No especificada'}</p>
              <p><strong>Fecha de creación:</strong> ${new Date(issue.timestamp || Date.now()).toLocaleDateString('es-ES')}</p>
              ${issue.action_plan ? `<p><strong>Plan de acción:</strong> ${issue.action_plan}</p>` : ''}
            </div>
          `).join('')}
          
        <div class="footer">
          <p>Este es un mensaje automático del sistema PRL Conecta. Por favor, no responda a este correo.</p>
        </div>
      </body>
    </html>
  `;
}
