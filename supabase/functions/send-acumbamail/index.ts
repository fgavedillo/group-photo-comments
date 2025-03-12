
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Standard CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  console.log("Acumbamail function invoked:", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Check for Acumbamail token
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

    // If this is a test call with no body, return diagnostic info
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

    // If this is a real request, parse the payload
    const payload = await req.json();
    console.log("Procesando solicitud de email con Acumbamail:", {
      to: payload.to,
      subject: payload.subject,
      hasDescription: !!payload.description,
      hasImageUrl: !!payload.imageUrl
    });

    // TODO: Implementar la integración real con Acumbamail aquí
    // Por ahora, simplemente devolvemos éxito como prueba

    // Return success for now
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de prueba procesado correctamente",
        to: payload.to,
        subject: payload.subject,
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
