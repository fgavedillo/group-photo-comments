
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders, handleCors } from "./cors.ts";
import { Resend } from "npm:resend@4.1.2";

// Obtener la clave API de Resend desde variables de entorno
const resendApiKey = Deno.env.get("RESEND_API_KEY");

if (!resendApiKey) {
  console.error("RESEND_API_KEY no está configurada en las variables de entorno");
  throw new Error("RESEND_API_KEY no está configurada");
}

// Inicializar el cliente de Resend
const resend = new Resend(resendApiKey);

// Función para registrar información
const logInfo = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const logPrefix = requestId ? `[${timestamp}] [${requestId}]` : `[${timestamp}]`;
  console.log(`${logPrefix} ${message}`, data || "");
};

// Configuración del remitente
const FROM_EMAIL = "Sistema de Gestión <info@prlconecta.es>";

console.log(`[${new Date().toISOString()}] Cargando función send-resend-report`);
console.log(`[${new Date().toISOString()}] Usando FROM address: ${FROM_EMAIL}`);
console.log(`[${new Date().toISOString()}] Configuration validated successfully`);

serve(async (req) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  logInfo(`Recibida solicitud ${req.method} desde ${req.headers.get("origin") || "origen desconocido"}`, null, requestId);
  
  // Manejar solicitudes de CORS primero
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Parsear el cuerpo de la solicitud
    const requestData = await req.json();
    logInfo("Datos de la solicitud:", JSON.stringify(requestData), requestId);
    
    // Extraer datos del email
    const { to, subject, html, clientRequestId } = requestData;
    
    // Usar el ID de solicitud proporcionado por el cliente si está disponible
    const logId = clientRequestId || requestId;
    
    // Validar campos requeridos
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error("Los destinatarios (to) son requeridos y deben ser un array");
    }
    
    // Registrar información detallada sobre los destinatarios
    logInfo(`Destinatarios (${to.length}):`, to, logId);
    to.forEach((recipient, index) => {
      logInfo(`Destinatario ${index + 1}: ${recipient}`, null, logId);
    });
    
    if (!subject) {
      throw new Error("El asunto es requerido");
    }
    
    if (!html || html.trim() === '') {
      throw new Error("El contenido HTML es requerido");
    }
    
    // Preparar datos del email para Resend
    const emailData = {
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
      // Agregar encabezados para rastreo
      headers: {
        "X-Entity-Ref-ID": logId
      },
      // Agregar etiquetas para mejor seguimiento
      tags: [
        { name: "source", value: "prlconecta" },
        { name: "category", value: "transactional" }
      ]
    };
    
    logInfo("Intentando enviar email a:", to, requestId);
    logInfo("Configuración completa del email:", emailData, requestId);
    
    // Enviar email con Resend
    const result = await resend.emails.send(emailData);
    
    const elapsedTime = Date.now() - startTime;
    logInfo(`Email enviado exitosamente en ${elapsedTime}ms:`, result, logId);
    
    // Verificar la dirección "from" en la respuesta
    if (result && result.from && result.from !== FROM_EMAIL) {
      console.warn(`ADVERTENCIA: Resend usó un remitente diferente (${result.from}) al solicitado (${FROM_EMAIL})`);
    }
    
    // Verificar los destinatarios en la respuesta si están disponibles
    if (result && result.to) {
      logInfo(`Destinatarios confirmados por Resend:`, result.to, logId);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: { 
          message: "Email enviado correctamente con Resend",
          id: result.id,
          recipients: to,
          emailSent: true,
          requestId: logId,
          elapsedTime: `${elapsedTime}ms`,
          fromEmail: FROM_EMAIL,
          actualFromEmail: result.from,
          senderDetails: {
            email: FROM_EMAIL.split("<")[1].replace(">", "").trim(),
            name: FROM_EMAIL.split("<")[0].trim()
          },
          stats: {
            successCount: 1,
            failureCount: 0
          }
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    logInfo(`Error durante la llamada a la API de Resend:`, error, requestId);
    console.error(`[${requestId}] Error en send-resend-report (${elapsedTime}ms):`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: error.message || "Error interno del servidor",
          requestId: requestId,
          elapsedTime: `${elapsedTime}ms`,
          fromEmail: FROM_EMAIL
        }
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
