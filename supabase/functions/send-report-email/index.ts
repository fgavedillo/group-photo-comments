
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Importación del archivo compartido de CORS
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

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

    // Obtener emails únicos de las incidencias
    const uniqueEmails = [...new Set(issues
      .map((issue: Issue) => issue.assignedEmail)
      .filter((email: string | undefined) => email && email.includes('@')))];

    if (uniqueEmails.length === 0) {
      console.error('No hay destinatarios válidos en las incidencias');
      throw new Error('No hay destinatarios válidos para enviar el resumen');
    }

    console.log('Destinatarios del email:', uniqueEmails);
    
    // Generar el HTML para el email
    const html = generateIssuesSummaryHtml(issues);

    // Verificar que tenemos la API key de Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurada');
      throw new Error('La API key de Resend no está configurada en las variables de entorno');
    }
    
    console.log('Enviando email usando Resend API...');
    
    // Enviar email usando la API de Resend directamente
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PRLconecta <onboarding@resend.dev>',
        to: uniqueEmails,
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

    console.log('Email enviado correctamente:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado correctamente a ${uniqueEmails.length} destinatarios`,
        recipients: uniqueEmails,
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
