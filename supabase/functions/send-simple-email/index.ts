
// Import from standard Deno modules
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp2@0.4.0/mod.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface EmailRequest {
  to: string;
  subject: string;
  description: string;
  date: string;
  issuesPageUrl: string;
  imageUrl: string | null;
}

serve(async (req) => {
  console.log("Recibida solicitud de correo:", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Parse the request body
    const requestData: EmailRequest = await req.json();
    const { to, subject, description, date, issuesPageUrl, imageUrl } = requestData;

    console.log(`Preparando correo para: ${to}`);

    // Get environment variables
    const username = Deno.env.get("GMAIL_USER") || "prevencionlingotes@gmail.com";
    let password = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!password) {
      throw new Error("La contraseña de la aplicación de Gmail no está configurada");
    }

    // Clean password - remove any spaces
    password = password.trim().replace(/\s+/g, '');
    
    if (password.length !== 16) {
      throw new Error(`La contraseña de la aplicación debe tener 16 caracteres (tiene ${password.length})`);
    }

    console.log(`Usando correo: ${username} (longitud de contraseña: ${password.length})`);

    // Create improved HTML content with better design
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificación de Incidencia</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f7fa;">
      <div style="max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); background-color: #ffffff;">
        <div style="background-color: #003366; padding: 25px; text-align: center; border-bottom: 4px solid #0066cc;">
          <h1 style="color: white; margin: 0; font-size: 26px; letter-spacing: 0.5px;">Nueva Incidencia Asignada</h1>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0;">
          <p style="color: #64748b; margin-top: 0; font-size: 15px;">Fecha: ${date}</p>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Descripción de la Incidencia:</h2>
            <p style="color: #334155; line-height: 1.6; margin-bottom: 0;">${description}</p>
          </div>
          
          ${imageUrl ? `
          <div style="margin: 25px 0; text-align: center;">
            <h3 style="color: #1e293b; margin-bottom: 15px; text-align: left; font-size: 16px;">Imagen Adjunta:</h3>
            <img src="${imageUrl}" alt="Imagen de la incidencia" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          </div>
          ` : ''}
          
          <div style="background-color: #eef2ff; padding: 20px; border-radius: 8px; margin-top: 25px;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 16px; border-bottom: 1px solid #c7d2fe; padding-bottom: 10px;">Próximos Pasos:</h3>
            <ol style="color: #1e3a8a; line-height: 1.7; margin-bottom: 0; padding-left: 20px;">
              <li>Revisar la incidencia en detalle</li>
              <li>Evaluar la situación y determinar un plan de acción</li>
              <li>Actualizar el estado de la incidencia en el sistema</li>
              <li>Documentar las medidas tomadas</li>
            </ol>
          </div>
        </div>
        
        <div style="padding: 25px; text-align: center; background-color: #ffffff;">
          <a href="${issuesPageUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 0 auto; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); transition: background-color 0.2s;">Ver en la Plataforma</a>
        </div>
        
        <div style="padding: 20px; background-color: #003366; border-top: 4px solid #0066cc; text-align: center;">
          <p style="margin: 0; color: #ffffff; font-size: 14px;">Este es un mensaje automático del sistema de gestión de incidencias.</p>
          <p style="margin: 10px 0 0; color: #cbd5e1; font-size: 13px;">Por favor, no responda directamente a este correo.</p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Sistema de Gestión de Incidencias</div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Configure SMTP client
    const client = new SmtpClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: username,
          password: password,
        }
      }
    });

    console.log("Cliente SMTP configurado, enviando correo...");

    // Send the email
    const sendResult = await client.send({
      from: username,
      to: [to],
      subject: subject,
      content: "Contenido alternativo en texto plano",
      html: htmlContent,
    });

    console.log("Correo enviado exitosamente:", sendResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Correo enviado exitosamente",
        messageId: sendResult?.messageId || `msg-${Date.now()}`
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error al enviar correo:", error);
    
    let errorMessage = error.message || "Error desconocido al enviar correo";
    let errorDetails = error.stack || errorMessage;
    
    // Mejorar mensajes para errores comunes
    if (errorMessage.includes("authentication") || errorMessage.includes("auth") || errorMessage.includes("535")) {
      errorMessage = "Error de autenticación con Gmail";
      errorDetails = "Verifique que la cuenta tenga verificación en dos pasos activada y que esté usando una contraseña de aplicación válida (16 caracteres).";
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
