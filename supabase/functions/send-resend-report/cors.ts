
// CORS headers to allow cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(`[${new Date().toISOString()}] Handling OPTIONS request for CORS preflight`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // For actual requests, return null and let the main handler continue
  return null;
}
