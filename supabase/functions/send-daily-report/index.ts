
import { serve } from "https://deno.land/std@0.198.0/http/server.ts";
import { SendDailyReportRequest, SendDailyReportResponse } from "./types.ts";
import { corsHeaders, MAX_EXECUTION_TIME } from "./config.ts";
import { generateAndSendReport } from "./reportGenerator.ts";
import { createErrorResponse } from "./services.ts";

serve(async (req) => {
  // Start timing
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Generar ID de solicitud único
  const requestId = (crypto.randomUUID && crypto.randomUUID()) || 
                    `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Processing request`);
  
  // Set timeout for the entire operation
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Operation timed out after ${MAX_EXECUTION_TIME}ms`);
    timeoutController.abort();
  }, MAX_EXECUTION_TIME);
  
  try {
    // Default values
    let manual = false;
    let filteredByUser = false;
    let clientRequestId = requestId;
    let debugMode = false;
    
    // Check if this is a manual trigger or has filtering options
    if (req.method === "POST") {
      try {
        const body: SendDailyReportRequest = await req.json();
        manual = !!body.manual;
        filteredByUser = !!body.filteredByUser;
        debugMode = !!body.debugMode;
        
        // Si el cliente proporcionó un ID de solicitud, úsalo para el seguimiento en logs
        if (body.requestId) {
          clientRequestId = body.requestId;
          console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Using client-provided requestId: ${clientRequestId}`);
        }
        
        console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Request params: manual=${manual}, filteredByUser=${filteredByUser}, debugMode=${debugMode}`);
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error parsing request body:`, parseError);
        // Continue with default values
      }
    }
    
    console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Starting report generation${manual ? " (manual)" : ""}${filteredByUser ? " (filtered)" : ""}${debugMode ? " (debug mode)" : ""}`);
    
    const result = await Promise.race([
      generateAndSendReport(manual, filteredByUser, requestId, debugMode),
      new Promise<never>((_, reject) => {
        // This promise will reject if the controller is aborted
        timeoutController.signal.addEventListener('abort', () => {
          reject(new Error(`Operation timed out after ${MAX_EXECUTION_TIME}ms`));
        });
      })
    ]);
    
    // Clear timeout since operation completed successfully
    clearTimeout(timeoutId);
    
    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [RequestID: ${requestId}] Request completed successfully in ${elapsedTime}ms`);
    
    return new Response(JSON.stringify({
      ...result,
      elapsedTime: `${elapsedTime}ms`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Clear timeout if it's still running
    clearTimeout(timeoutId);
    
    // Calculate elapsed time for error case
    const elapsedTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [RequestID: ${requestId}] Error processing request (${elapsedTime}ms):`, error);
    
    return createErrorResponse(error, requestId, elapsedTime);
  }
});
