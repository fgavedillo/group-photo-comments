
// Import from standard Deno modules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  console.log("Test Acumbamail function invoked:", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Basic test information
    const info = {
      status: "running",
      timestamp: new Date().toISOString(),
      environment: Deno.env.get("ENVIRONMENT") || "development",
      runtime: {
        deno: Deno.version.deno,
        v8: Deno.version.v8,
        typescript: Deno.version.typescript
      },
      acumbamail_token_exists: !!Deno.env.get("ACUMBAMAIL_AUTH_TOKEN"),
      message: "Prueba de función Acumbamail"
    };

    console.log("Información de prueba:", info);

    return new Response(
      JSON.stringify(info),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error en la función de prueba Acumbamail:", error);
    
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
