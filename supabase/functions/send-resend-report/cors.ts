
// CORS headers to allow requests from any origin
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper function to handle CORS preflight
export function handleCors(req: Request): Response | null {
  // Handle OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight');
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders,
    });
  }
  return null;
}
