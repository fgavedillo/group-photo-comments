
// Import from standard Deno modules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers para permitir solicitudes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  console.log("Health Check function invoked:", new Date().toISOString());
  
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Información básica sobre la función y el entorno
    const info = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: Deno.env.get("ENVIRONMENT") || "development",
      runtime: {
        deno: Deno.version.deno,
        v8: Deno.version.v8,
        typescript: Deno.version.typescript
      },
      message: "La función Edge se ha desplegado correctamente"
    };

    console.log("Respondiendo con información de estado:", info);

    return new Response(
      JSON.stringify(info),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error en la función health-check:", error);
    
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
