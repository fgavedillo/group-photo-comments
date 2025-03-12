
// Import from standard Deno modules
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  console.log("Recibida solicitud de correo usando Acumbamail:", new Date().toISOString());
  
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

    console.log(`Preparando correo para: ${to} usando Acumbamail`);

    // Get the Acumbamail auth token
    const authToken = Deno.env.get("ACUMBAMAIL_AUTH_TOKEN");

    if (!authToken) {
      throw new Error("El token de autenticación de Acumbamail no está configurado");
    }

    console.log(`Usando token de autenticación de Acumbamail (longitud: ${authToken.length})`);

    // Create HTML content for the email
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

    // Prepare the form data for Acumbamail API
    const formData = new FormData();
    formData.append("auth_token", authToken);
    formData.append("from_email", "prevencionlingotes@gmail.com");
    formData.append("from_name", "Sistema de Gestión de Incidencias");
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", htmlContent);
    formData.append("response_type", "json");

    console.log("Enviando solicitud a la API de Acumbamail...");

    // Send the request to Acumbamail API
    const response = await fetch("https://acumbamail.com/api/1/sendEmail/", {
      method: "POST",
      body: formData,
    });

    // Parse the response
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      console.log("Raw response:", responseText);
      responseData = { status: "error", message: "Error parsing response" };
    }

    console.log("Respuesta de Acumbamail:", responseData);

    // Check if the request was successful
    if (response.status === 200 || response.status === 201) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Correo enviado exitosamente mediante Acumbamail",
          response: responseData,
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } else {
      throw new Error(`Error en la API de Acumbamail: ${response.status} - ${responseData?.error || responseText}`);
    }
  } catch (error) {
    console.error("Error al enviar correo con Acumbamail:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Error desconocido al enviar correo",
        details: error.stack || "No hay detalles adicionales"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

