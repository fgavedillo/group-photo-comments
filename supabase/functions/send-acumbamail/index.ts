
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  console.log("Acumbamail function invoked:", new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const acumbamailToken = Deno.env.get("ACUMBAMAIL_AUTH_TOKEN");
    
    if (!acumbamailToken) {
      console.error("ACUMBAMAIL_AUTH_TOKEN no está configurado");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API token de Acumbamail no configurado" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    if (req.method === 'GET' || req.headers.get('content-length') === '0') {
      const info = {
        status: "running",
        timestamp: new Date().toISOString(),
        environment: Deno.env.get("ENVIRONMENT") || "production",
        runtime: {
          deno: Deno.version.deno,
          v8: Deno.version.v8,
          typescript: Deno.version.typescript
        },
        acumbamail_token_exists: !!acumbamailToken,
        message: "Función Acumbamail operativa"
      };

      console.log("Información de diagnóstico:", info);
      
      return new Response(
        JSON.stringify(info),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const payload = await req.json();
    console.log("Procesando solicitud de email con Acumbamail:", {
      to: payload.to,
      subject: payload.subject,
      hasDescription: !!payload.description,
      hasImageUrl: !!payload.imageUrl
    });

    // Construir el HTML del email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>${payload.subject}</h2>
          <p>${payload.description}</p>
          ${payload.imageUrl ? `<img src="${payload.imageUrl}" style="max-width: 100%;" />` : ''}
          ${payload.issuesPageUrl ? `<p><a href="${payload.issuesPageUrl}">Ver detalles</a></p>` : ''}
        </body>
      </html>
    `;

    // Llamada a la API de Acumbamail
    const acumbamailResponse = await fetch('https://acumbamail.com/api/1/sendEmail/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${acumbamailToken}`
      },
      body: JSON.stringify({
        from_email: 'prevencionlingotes@gmail.com',
        from_name: 'Sistema de Prevención',
        to: [payload.to],
        subject: payload.subject,
        html: emailHtml
      })
    });

    const acumbamailData = await acumbamailResponse.json();
    console.log("Respuesta de Acumbamail:", acumbamailData);

    if (!acumbamailResponse.ok) {
      throw new Error(`Error de Acumbamail: ${JSON.stringify(acumbamailData)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado correctamente",
        acumbamailResponse: acumbamailData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error en la función Acumbamail:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Error desconocido",
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
