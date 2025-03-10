
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

    // Create HTML content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #0f172a; padding: 15px; border-radius: 6px 6px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Nueva Incidencia Asignada</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e0e0e0;">
        <p style="color: #64748b; margin-top: 0;">Fecha: ${date}</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Se ha reportado una nueva incidencia que requiere de su atención. A continuación, se detallan los pormenores:
        </p>
        
        <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin-top: 0;">Descripción de la Incidencia:</h3>
          <p style="color: #334155; line-height: 1.6;">${description}</p>
        </div>
        
        ${imageUrl ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin-bottom: 10px;">Imagen Adjunta:</h3>
          <img src="${imageUrl}" alt="Imagen de la incidencia" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        </div>
        ` : ''}
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 4px;">
          <h3 style="color: #1e40af; margin-top: 0;">Próximos Pasos:</h3>
          <ol style="color: #1e3a8a; line-height: 1.6;">
            <li>Revisar la incidencia en detalle</li>
            <li>Evaluar la situación y determinar un plan de acción</li>
            <li>Actualizar el estado de la incidencia en el sistema</li>
            <li>Documentar las medidas tomadas</li>
          </ol>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center;">
        <a href="${issuesPageUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver en la Plataforma</a>
      </div>
      
      <div style="padding: 15px; background-color: #f1f5f9; border-radius: 0 0 6px 6px; font-size: 12px; color: #64748b; text-align: center;">
        <p>Este es un mensaje automático del sistema de gestión de incidencias.</p>
        <p>Por favor, no responda directamente a este correo.</p>
      </div>
    </div>
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
