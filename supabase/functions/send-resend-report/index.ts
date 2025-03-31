
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { Resend } from "https://esm.sh/@resend/node@0.5.0";

// Initialize Resend with API key from environment
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = "PRL Conecta <onboarding@resend.dev>"; // Using verified sender

if (!resendApiKey) {
  console.error("RESEND_API_KEY environment variable is not set");
  throw new Error("RESEND_API_KEY environment variable is not set");
}

const resend = new Resend(resendApiKey);

// Function to log information about request and configuration
const logInfo = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const logPrefix = requestId ? `[${timestamp}] [${requestId}]` : `[${timestamp}]`;
  console.log(`${logPrefix} ${message}`, data || "");
};

console.log(`[${new Date().toISOString()}] Loading send-resend-report function`);

// Validate configuration
if (resendApiKey?.length >= 20) {
  console.log(`[${new Date().toISOString()}] Configuration validated successfully`);
  console.log(`[${new Date().toISOString()}] Using FROM address: ${fromEmail}`);
} else {
  console.error(`[${new Date().toISOString()}] Invalid RESEND_API_KEY configuration`);
}

// Function to generate HTML for email with dashboard-like view
function generateDashboardEmailHTML(issues: any[], filtered: boolean = false) {
  // Get current date for the report
  const date = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Group issues by status for statistics
  const statusGroups: Record<string, any[]> = {};
  issues.forEach(issue => {
    const status = issue.status || 'sin-estado';
    if (!statusGroups[status]) {
      statusGroups[status] = [];
    }
    statusGroups[status].push(issue);
  });

  // Generate status distribution data
  const statusData = Object.entries(statusGroups).map(([status, groupIssues]) => ({
    status,
    count: groupIssues.length,
    label: getStatusLabel(status),
    color: getStatusColor(status)
  }));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Incidencias${filtered ? ' Personalizado' : ''}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #003366; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .summary { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
          .stat-card { flex: 1; min-width: 120px; background: white; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .stat-value { font-size: 24px; font-weight: bold; }
          .stat-label { font-size: 14px; color: #666; }
          .issues-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          .issues-table th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
          .issues-table td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
          .issue-image { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
          .status-badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
          .en-estudio { background: #e1f0ff; color: #0066cc; }
          .en-curso { background: #fff8e1; color: #f59f00; }
          .cerrada { background: #e3fcef; color: #099268; }
          .denegada { background: #fff5f5; color: #e03131; }
          .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          @media (max-width: 600px) {
            .stat-card { min-width: 100%; }
            .issues-table { font-size: 12px; }
            .issue-image { width: 60px; height: 60px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Incidencias${filtered ? ' Personalizado' : ''}</h1>
            <p>Fecha: ${date}</p>
          </div>
          
          <div class="content">
            <h2>Resumen de Incidencias</h2>
            
            <div class="summary">
              <div class="stat-card">
                <div class="stat-value">${issues.length}</div>
                <div class="stat-label">Total</div>
              </div>
              
              ${statusData.map(stat => `
                <div class="stat-card" style="border-top: 3px solid ${stat.color}">
                  <div class="stat-value">${stat.count}</div>
                  <div class="stat-label">${stat.label}</div>
                </div>
              `).join('')}
            </div>
            
            <h2>Listado de Incidencias</h2>
            
            ${issues.length === 0 ? 
              '<p>No hay incidencias para mostrar.</p>' : 
              `<table class="issues-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Imagen</th>
                    <th>Detalles</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  ${issues.map(issue => `
                    <tr>
                      <td>#${issue.id}</td>
                      <td>
                        ${issue.imageUrl ? 
                          `<img src="${issue.imageUrl}" alt="Imagen de incidencia" class="issue-image">` : 
                          'Sin imagen'}
                      </td>
                      <td>
                        <div><strong>Área:</strong> ${issue.area || 'No especificada'}</div>
                        <div><strong>Descripción:</strong> ${issue.message || 'Sin descripción'}</div>
                        <div><strong>Fecha:</strong> ${new Date(issue.timestamp).toLocaleDateString('es-ES')}</div>
                      </td>
                      <td>
                        <span class="status-badge ${issue.status || 'sin-estado'}">${getStatusLabel(issue.status)}</span>
                      </td>
                      <td>${issue.responsable || 'Sin asignar'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
            }
          </div>
          
          <div class="footer">
            <p>Este es un correo automático generado por el sistema PRL Conecta.</p>
            <p>© ${new Date().getFullYear()} PRL Conecta - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Helper functions for email generation
function getStatusLabel(status: string): string {
  switch (status) {
    case "en-estudio": return "En Estudio";
    case "en-curso": return "En Curso";
    case "cerrada": return "Cerrada";
    case "denegado": return "Denegada";
    default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Sin Estado";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "en-estudio": return "#0066cc";
    case "en-curso": return "#f59f00";
    case "cerrada": return "#099268";
    case "denegado": return "#e03131";
    default: return "#6c757d";
  }
}

// Fetch issues from Supabase
async function fetchIssues(requestId: string) {
  const supabaseUrl = "https://jzmzmjvtxcrxljnhhrjo.supabase.co";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  
  try {
    logInfo("Fetching issues data from Supabase...", null, requestId);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/issue_details?select=*`, {
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching issues: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logInfo(`Fetched ${data.length} issues successfully`, null, requestId);
    return data;
  } catch (error) {
    logInfo(`Error fetching issues: ${error.message}`, null, requestId);
    throw error;
  }
}

serve(async (req) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  logInfo(`Received ${req.method} request from ${req.headers.get("origin") || "unknown origin"}`, null, requestId);
  
  // Handle CORS preflight requests first
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    logInfo("Request data:", JSON.stringify(requestData), requestId);
    
    // Extract email data
    const { to, subject, html, filtered = false, clientRequestId } = requestData;
    
    // Use client-provided request ID if available for easier tracking
    const logId = clientRequestId || requestId;
    
    // Validate required fields
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error("Recipients (to) are required and must be an array");
    }
    
    if (!subject) {
      throw new Error("Subject is required");
    }
    
    // Fetch issues for the report if we need to generate a dashboard
    let issues = [];
    let finalHtml = html;
    
    if (requestData.generateDashboard) {
      logInfo("Fetching issues for dashboard report", null, logId);
      issues = await fetchIssues(logId);
      
      // Generate dashboard HTML
      finalHtml = generateDashboardEmailHTML(issues, filtered);
      logInfo("Dashboard HTML generated successfully", null, logId);
    }
    
    // Prepare email data for Resend
    const emailData = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: finalHtml
    };
    
    logInfo("Attempting to send email to:", to, requestId);
    
    // Send email via Resend
    try {
      const result = await resend.emails.send(emailData);
      
      const elapsedTime = Date.now() - startTime;
      logInfo(`Email sent successfully via Resend in ${elapsedTime}ms:`, result, logId);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: { 
            message: "Email sent successfully",
            id: result.id,
            recipients: to,
            emailSent: true,
            mode: filtered ? "filtered" : "all recipients",
            requestId: logId,
            elapsedTime: `${elapsedTime}ms`,
            stats: {
              successCount: to.length,
              failureCount: 0,
              issueCount: issues.length
            }
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    } catch (resendError) {
      logInfo(`Error received FROM Resend API:`, resendError, requestId);
      throw new Error(`Error al enviar email con Resend: ${JSON.stringify(resendError)}`);
    }
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    logInfo(`Error DURING Resend API call:`, error, requestId);
    console.error(`[${requestId}] Error in send-resend-report (${elapsedTime}ms):`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Internal Server Error",
          requestId: requestId,
          elapsedTime: `${elapsedTime}ms`
        }
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
});
