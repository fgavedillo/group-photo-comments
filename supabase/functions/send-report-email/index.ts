
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
    
    const { issues } = reqBody;
    debugLog(`Datos de issues recibidos:`, issues);
    
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
    
    // Generar el HTML para el email
    const html = generateIssuesSummaryHtml(issues);
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
        from: 'Acme <onboarding@resend.dev>',
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
 * Genera el HTML para el resumen de incidencias
 */
function generateIssuesSummaryHtml(issues: Issue[]): string {
  const issuesList = issues
    .map(
      (issue) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.id}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.message}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.status}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.area || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.responsable || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${issue.assignedEmail || '-'}</td>
      </tr>
    `
    )
    .join('');

  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1>Resumen de Incidencias Asignadas</h1>
        <p>Este es un resumen de las incidencias que están actualmente en estudio o en curso y requieren su atención:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #ddd;">ID</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Descripción</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Estado</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Área</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Responsable</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Email Asignado</th>
            </tr>
          </thead>
          <tbody>
            ${issuesList}
          </tbody>
        </table>
        
        <p style="margin-top: 20px; color: #666;">
          Este es un email automático del sistema de gestión de incidencias de PRLconecta.
          Por favor, no responda a este email.
        </p>
      </body>
    </html>
  `;
}
