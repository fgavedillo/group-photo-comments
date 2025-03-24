import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, SEND_EMAIL_FUNCTION_URL, REQUEST_TIMEOUT } from "./config.ts";
import { ReportRow } from "./types.ts";

// Create a Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Function to create error response with corsHeaders
export function createErrorResponse(error: any, requestId: string, elapsedTime: number) {
  console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error details:`, error);
  
  // Intentar extraer un mensaje de error más descriptivo
  let errorMessage = error.message || "Error desconocido procesando la solicitud";
  let errorDetails = error.stack || "No hay detalles adicionales disponibles";
  
  // Si hay información más específica en error.cause
  if (error.cause) {
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error cause:`, error.cause);
    if (error.cause.message) {
      errorMessage = `${errorMessage} - ${error.cause.message}`;
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: errorMessage,
        details: errorDetails,
        requestId: requestId
      },
      elapsedTime: `${elapsedTime}ms`
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Fetch all issues from the database
export async function fetchAllIssues(requestId: string): Promise<ReportRow[]> {
  console.log(`[${requestId}] Iniciando consulta de incidencias en la base de datos`);
  
  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        id,
        message,
        timestamp,
        status,
        area,
        responsable,
        assigned_email,
        security_improvement,
        action_plan,
        issue_images (image_url)
      `)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error(`[${requestId}] Error en consulta SQL:`, error);
      throw error;
    }

    console.log(`[${requestId}] Consulta exitosa. Incidencias encontradas: ${data?.length || 0}`);
    console.log(`[${requestId}] Muestra de datos:`, data?.slice(0, 2));
    
    return data || [];
  } catch (error) {
    console.error(`[${requestId}] Error en fetchAllIssues:`, error);
    throw error;
  }
}

// Send email using the send-email Edge Function
export async function sendEmail(
  to: string, 
  subject: string, 
  html: string, 
  requestId: string,
  cc?: string[]
): Promise<void> {
  console.log(`[${requestId}] Iniciando envío de email a: ${to}`);
  console.log(`[${requestId}] CC: ${cc?.join(', ') || 'No hay CC'}`);
  
  try {
    // Limitar el tamaño del contenido
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (html.length > MAX_SIZE) {
      // Eliminar imágenes base64 y reemplazar con enlaces
      html = html.replace(/data:image\/[^;]+;base64,[^"]+/g, 
        'https://tu-dominio.com/placeholder-image.png');
    }
    
    // Prepare headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("apikey", Deno.env.get("SUPABASE_ANON_KEY") || "");
    
    // Add CORS headers
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }
    
    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Email payload
    const payload = {
      to,
      subject,
      html,
      cc,
      requestId: `email-${requestId}-${Date.now()}`
    };
    
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Sending email request to Edge Function`);
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Using URL: ${SEND_EMAIL_FUNCTION_URL}`);
    
    // Send the request
    const response = await fetch(SEND_EMAIL_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Get the response body
    const responseBody = await response.text();
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email function response:`, responseBody);
    
    // Check for errors
    if (!response.ok) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error response from send-email function:`, responseBody);
      
      try {
        // Try to parse as JSON to get more details
        const errorData = JSON.parse(responseBody);
        throw new Error(`Error sending email: HTTP ${response.status} - ${errorData.error?.message || responseBody}`);
      } catch (parseError) {
        // If parsing fails, use the raw response
        throw new Error(`Error sending email: HTTP ${response.status} - ${responseBody}`);
      }
    }
    
    // Success
    console.log(`[${requestId}] Email enviado exitosamente a ${to}`);
  } catch (error) {
    console.error(`[${requestId}] Error en envío de email:`, error);
    console.error(`[${requestId}] Destinatario: ${to}`);
    console.error(`[${requestId}] Detalles adicionales:`, {
      subjectLength: subject.length,
      htmlLength: html.length,
      ccCount: cc?.length || 0
    });
    throw error;
  }
}
