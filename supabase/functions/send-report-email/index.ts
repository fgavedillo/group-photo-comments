
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Importación del archivo compartido de CORS
import { corsHeaders } from "../_shared/cors.ts";

// Obtener la API key de Resend de las variables de entorno
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Email registrado en Resend
const RESEND_REGISTERED_EMAIL = "avedillo81@gmail.com";

// Configuración para modo debug
const DEBUG_MODE = true;

interface Issue {
  id: number;
  message: string;
  timestamp?: string;
  username?: string;
  status: string;
  securityImprovement?: string;
  actionPlan?: string;
  assignedEmail?: string;
  area?: string;
  responsable?: string;
  user_id?: string;
  url_key?: string;
  imageUrl?: string; // Añadido para incluir las imágenes
}

// Función de ayuda para loggear información de depuración
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(`DEBUG: ${message}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    } else {
      console.log(`DEBUG: ${message}`);
    }
  }
};

serve(async (req) => {
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    debugLog("Recibida solicitud CORS OPTIONS");
    return new Response(null, { headers: corsHeaders });
  }

  debugLog("=== INICIO DE LA FUNCIÓN EDGE ===");
  debugLog(`Método de la solicitud: ${req.method}`);
  debugLog(`Headers:`, Object.fromEntries(req.headers.entries()));

  try {
    // Verificar que tenemos la API key
    if (!RESEND_API_KEY) {
      throw new Error('La API key de Resend no está configurada en las variables de entorno');
    }

    debugLog(`API Key de Resend presente: ${RESEND_API_KEY ? "Sí (oculta)" : "No"}`);
    
    // Obtener y validar el cuerpo de la solicitud
    let reqBody;
    const contentType = req.headers.get("content-type") || '';
    debugLog(`Content-Type: ${contentType}`);
    
    try {
      const text = await req.text();
      debugLog(`Cuerpo de la solicitud (texto): ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
      
      try {
        reqBody = JSON.parse(text);
        debugLog("Cuerpo de la solicitud parseado como JSON");
      } catch (parseError) {
        debugLog(`Error al parsear JSON: ${parseError.message}`);
        throw new Error(`El cuerpo de la solicitud no es un JSON válido: ${parseError.message}`);
      }
    } catch (textError) {
      debugLog(`Error al obtener el texto del cuerpo: ${textError.message}`);
      throw new Error(`No se pudo leer el cuerpo de la solicitud: ${textError.message}`);
    }
    
    const { issues, dashboardStats } = reqBody;
    debugLog(`Datos de issues recibidos:`, issues);
    debugLog(`Datos de dashboard recibidos:`, dashboardStats);
    
    // Validar que issues sea un array
    if (!Array.isArray(issues)) {
      debugLog('El campo issues no es un array:', issues);
      throw new Error('El campo issues debe ser un array');
    }
    
    if (issues.length === 0) {
      debugLog('El array de incidencias está vacío');
      throw new Error('No se proporcionaron incidencias para enviar');
    }

    debugLog(`Procesando ${issues.length} incidencias`);

    // En modo prueba de Resend, solo podemos enviar al email registrado
    // En lugar de intentar enviar a múltiples destinatarios, generamos el informe
    // y lo enviamos solo al email registrado
    
    // Generar el HTML para el email con un formato mejorado
    const html = generateEnhancedEmailHtml(issues, dashboardStats || {});
    debugLog(`HTML generado correctamente (${html.length} caracteres)`);
    
    debugLog(`Enviando email a: ${RESEND_REGISTERED_EMAIL}`);
    
    // Enviar email usando la API de Resend directamente
    debugLog("Enviando solicitud a la API de Resend...");
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PRLconecta <onboarding@resend.dev>',
        to: [RESEND_REGISTERED_EMAIL],
        subject: 'Resumen de Incidencias Asignadas - PRLconecta',
        html: html,
      }),
    });

    const responseStatus = resendResponse.status;
    const responseHeaders = Object.fromEntries(resendResponse.headers.entries());
    debugLog(`Estado de respuesta de Resend: ${responseStatus}`);
    debugLog(`Headers de respuesta:`, responseHeaders);
    
    let responseData;
    try {
      responseData = await resendResponse.json();
      debugLog(`Respuesta de Resend:`, responseData);
    } catch (jsonError) {
      const textResponse = await resendResponse.text();
      debugLog(`Error al parsear la respuesta como JSON. Respuesta en texto:`, textResponse);
      responseData = { error: "No se pudo parsear la respuesta como JSON", raw: textResponse };
    }
    
    if (!resendResponse.ok) {
      debugLog(`Error de Resend (${responseStatus}):`, responseData);
      throw new Error(`Error al enviar el email: ${
        responseData.message || 
        responseData.error?.message || 
        JSON.stringify(responseData)
      }`);
    }

    // Crear lista de emails que deberían haber recibido el informe
    // (aunque en modo prueba solo lo recibe el email registrado)
    const assignedEmails = issues
      .map((issue: Issue) => issue.assignedEmail)
      .filter((email: string | undefined) => email && email.includes('@'));
    
    const uniqueEmails = [...new Set(assignedEmails)];
    debugLog(`Emails asignados originales: ${uniqueEmails.join(', ')}`);

    debugLog("=== RESPUESTA EXITOSA ===");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado al email de prueba (${RESEND_REGISTERED_EMAIL})`,
        note: "En modo prueba, Resend solo permite enviar al email registrado",
        originalRecipients: uniqueEmails,
        resendResponse: responseData,
        debug: {
          mode: DEBUG_MODE,
          timestamp: new Date().toISOString(),
          requestInfo: {
            method: req.method,
            contentType: contentType,
          }
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    debugLog("=== ERROR EN LA FUNCIÓN ===");
    debugLog(`Error: ${error.message}`);
    debugLog(`Stack: ${error.stack}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar el email',
        debug: {
          mode: DEBUG_MODE,
          timestamp: new Date().toISOString(),
          errorDetails: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : String(error)
        }
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});

/**
 * Genera un gráfico simple de distribución de incidencias por estado
 */
function generateStatusChartSVG(issues: Issue[]): string {
  const statusCount: Record<string, number> = {};
  
  // Contar incidencias por estado
  issues.forEach(issue => {
    const status = issue.status || 'sin-estado';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  // Definir colores para cada estado
  const colors: Record<string, string> = {
    'en-estudio': '#4F46E5', // indigo
    'en-curso': '#F59E0B',   // amber
    'cerrada': '#10B981',    // emerald
    'denegado': '#EF4444',   // red
    'sin-estado': '#6B7280'  // gray
  };
  
  // Calcular proporciones para el gráfico
  const total = issues.length;
  let currentX = 0;
  const barHeight = 30;
  const width = 800;
  const segments = Object.entries(statusCount).map(([status, count]) => {
    const segmentWidth = Math.round((count / total) * width);
    const segment = {
      status,
      width: segmentWidth,
      x: currentX,
      color: colors[status] || '#6B7280'
    };
    currentX += segmentWidth;
    return segment;
  });
  
  // Generar el SVG inline
  return `
    <svg width="${width}" height="${barHeight + 60}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .chart-label { font: 12px Arial; fill: #333; }
        .chart-pct { font: bold 12px Arial; fill: #333; text-anchor: middle; }
      </style>
      ${segments.map(segment => `
        <g>
          <rect x="${segment.x}" y="0" width="${segment.width}" height="${barHeight}" fill="${segment.color}" />
          ${segment.width > 40 ? `
            <text x="${segment.x + segment.width/2}" y="${barHeight + 20}" class="chart-label">
              ${formatStatus(segment.status)}
            </text>
            <text x="${segment.x + segment.width/2}" y="${barHeight + 40}" class="chart-pct">
              ${Math.round((segment.width / width) * 100)}%
            </text>
          ` : ''}
        </g>
      `).join('')}
    </svg>
  `;
}

/**
 * Genera un HTML mejorado para el email, incluyendo dashboard y fotos
 */
function generateEnhancedEmailHtml(issues: Issue[], dashboardStats: any): string {
  // Generar SVG del gráfico de estados
  const statusChartSvg = generateStatusChartSVG(issues);
  
  // Generar filas para la tabla de incidencias con imágenes
  const issueRows = issues.map(issue => {
    // Verificar si existe una URL de imagen válida
    const imageCell = issue.imageUrl ? 
      `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
        <img src="${issue.imageUrl}" alt="Imagen de incidencia" style="max-width: 100px; max-height: 100px; border-radius: 4px;" />
      </td>` : 
      `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">Sin imagen</td>`;
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.id}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.message}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${formatStatus(issue.status)}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.area || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.responsable || '-'}</td>
        ${imageCell}
      </tr>
    `;
  }).join('');

  // Construir el HTML completo con un diseño mejorado
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resumen de Incidencias - PRLconecta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <!-- Cabecera -->
      <div style="background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">Resumen de Incidencias Asignadas</h1>
        <p style="margin: 10px 0 0;">Generado el ${new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      
      <!-- Resumen del Dashboard -->
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #4F46E5; font-size: 20px;">Resumen del Dashboard</h2>
        
        <div style="display: flex; margin-bottom: 20px; justify-content: space-between;">
          <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; margin-right: 10px; text-align: center;">
            <p style="font-size: 14px; margin: 0; color: #6B7280;">Total Incidencias</p>
            <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">${issues.length}</p>
          </div>
          
          <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; margin-right: 10px; text-align: center;">
            <p style="font-size: 14px; margin: 0; color: #6B7280;">En Estudio</p>
            <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">${issues.filter(i => i.status === 'en-estudio').length}</p>
          </div>
          
          <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="font-size: 14px; margin: 0; color: #6B7280;">En Curso</p>
            <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">${issues.filter(i => i.status === 'en-curso').length}</p>
          </div>
        </div>
        
        <h3 style="margin-top: 0; color: #4F46E5; font-size: 16px;">Distribución por Estado</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
          ${statusChartSvg}
        </div>
      </div>
      
      <!-- Tabla de Incidencias -->
      <div style="background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-bottom: 20px;">
        <h2 style="background-color: #f3f4f6; margin: 0; padding: 15px 20px; border-radius: 8px 8px 0 0; font-size: 18px; color: #4F46E5;">
          Detalle de Incidencias
        </h2>
        
        <div style="padding: 0 20px 20px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">ID</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Descripción</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Estado</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Área</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Responsable</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Imagen</th>
              </tr>
            </thead>
            <tbody>
              ${issueRows}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Pie -->
      <div style="background-color: #f3f4f6; color: #6B7280; padding: 15px; border-radius: 8px; font-size: 14px; text-align: center;">
        <p style="margin: 0;">Este es un email automático del sistema de gestión de incidencias de PRLconecta.</p>
        <p style="margin: 10px 0 0;">Por favor, no responda a este email.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Formatea los estados de las incidencias para mostrarlos de forma más amigable
 */
function formatStatus(status: string): string {
  switch (status) {
    case 'en-estudio': return 'En Estudio';
    case 'en-curso': return 'En Curso';
    case 'cerrada': return 'Cerrada';
    case 'denegado': return 'Denegada';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
