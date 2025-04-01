
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Importación del archivo compartido de CORS
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Email registrado en Resend (usamos el email detectado en los logs)
const RESEND_REGISTERED_EMAIL = "avedillo81@gmail.com";

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

serve(async (req) => {
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando función send-report-email');
    
    // Obtener y validar el cuerpo de la solicitud
    let reqBody;
    try {
      reqBody = await req.json();
      console.log('Cuerpo de la solicitud recibido:', JSON.stringify(reqBody));
    } catch (jsonError) {
      console.error('Error al parsear JSON:', jsonError);
      throw new Error('El cuerpo de la solicitud no es un JSON válido');
    }
    
    const { issues } = reqBody;
    
    // Validar que issues sea un array
    if (!Array.isArray(issues)) {
      console.error('El campo issues no es un array:', issues);
      throw new Error('El campo issues debe ser un array');
    }
    
    if (issues.length === 0) {
      console.error('El array de incidencias está vacío');
      throw new Error('No se proporcionaron incidencias para enviar');
    }

    console.log(`Procesando ${issues.length} incidencias`);

    // Verificar que tenemos la API key de Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurada');
      throw new Error('La API key de Resend no está configurada en las variables de entorno');
    }
    
    // En modo prueba de Resend, solo podemos enviar al email registrado
    // En lugar de intentar enviar a múltiples destinatarios, generamos el informe
    // y lo enviamos solo al email registrado
    
    // Generar el HTML para el email
    const html = generateIssuesSummaryHtml(issues);
    
    console.log('Enviando email de resumen a:', RESEND_REGISTERED_EMAIL);
    
    // Enviar email usando la API de Resend directamente, pero solo al email registrado
    const res = await fetch('https://api.resend.com/emails', {
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

    const responseStatus = res.status;
    console.log('Estado de respuesta de Resend:', responseStatus);
    
    const data = await res.json();
    console.log('Respuesta de Resend:', JSON.stringify(data));
    
    if (!res.ok) {
      console.error('Error de Resend:', data);
      throw new Error(`Error al enviar el email: ${data.message || JSON.stringify(data)}`);
    }

    // Crear lista de emails que deberían haber recibido el informe
    // (aunque en modo prueba solo lo recibe el email registrado)
    const assignedEmails = issues
      .map((issue: Issue) => issue.assignedEmail)
      .filter((email: string | undefined) => email && email.includes('@'));
    
    const uniqueEmails = [...new Set(assignedEmails)];

    console.log('Email enviado correctamente al email de prueba:', RESEND_REGISTERED_EMAIL);
    console.log('Destinatarios originales (no recibieron email en modo prueba):', uniqueEmails);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado al email de prueba (${RESEND_REGISTERED_EMAIL})`,
        note: "En modo prueba, Resend solo permite enviar al email registrado",
        originalRecipients: uniqueEmails,
        resendResponse: data
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error en la función send-report-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al enviar el email' 
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
