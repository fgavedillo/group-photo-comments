
// CORS headers permitidos para las funciones de API
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Función helper para manejo de preflight CORS
export function handleCors(req: Request): Response | null {
  // Manejar solicitudes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders,
    });
  }
  return null;
}
