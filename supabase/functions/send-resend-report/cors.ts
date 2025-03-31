
// CORS headers para permitir solicitudes desde cualquier origen
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Función helper para manejar CORS preflight
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
