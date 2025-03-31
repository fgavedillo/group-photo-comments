
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

// Configuración del remitente - se utilizará el correo verificado de Resend en producción
// Obtenemos el email de testeo para modo sandbox
const VERIFIED_EMAIL = Deno.env.get("RESEND_VERIFIED_EMAIL") || "avedillo81@gmail.com";
const FROM_NAME = "Sistema de Gestión";
const FROM_EMAIL = `${FROM_NAME} <${VERIFIED_EMAIL}>`;

// Determinar si estamos en modo de prueba (sin dominio verificado)
const IN_TEST_MODE = true; // Por defecto asumimos modo de prueba para evitar errores

console.log(`[${new Date().toISOString()}] Cargando función send-resend-report`);
console.log(`[${new Date().toISOString()}] Usando FROM address: ${FROM_EMAIL}`);
console.log(`[${new Date().toISOString()}] Modo de prueba: ${IN_TEST_MODE ? "Activado" : "Desactivado"}`);
console.log(`[${new Date().toISOString()}] Email verificado: ${VERIFIED_EMAIL}`);
console.log(`[${new Date().toISOString()}] Configuración validada correctamente`);

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
    logInfo(`Destinatarios originales (${to.length}):`, to, logId);
    
    // En modo de prueba, enviamos solo al email verificado pero mantenemos registro de destinatarios originales
    const recipients = IN_TEST_MODE ? [VERIFIED_EMAIL] : to;
    const originalRecipients = to;
    
    logInfo(`Destinatarios efectivos (${recipients.length}):`, recipients, logId);
    recipients.forEach((recipient, index) => {
      logInfo(`Destinatario ${index + 1}: ${recipient}`, null, logId);
    });
    
    if (!subject) {
      throw new Error("El asunto es requerido");
    }
    
    if (!html || html.trim() === '') {
      throw new Error("El contenido HTML es requerido");
    }
    
    // Añadir aviso en modo de prueba
    let emailContent = html;
    if (IN_TEST_MODE && to.length > 1) {
      const testModeWarning = `
        <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; margin: 20px 0; border-radius: 5px; color: #856404;">
          <h3 style="margin-top: 0;">⚠️ Modo de Prueba - Resend</h3>
          <p>Este correo se está enviando en <strong>modo de prueba</strong>. En producción, sería enviado a los siguientes destinatarios:</p>
          <ul>
            ${originalRecipients.map(email => `<li>${email}</li>`).join('')}
          </ul>
          <p>Para enviar a todos los destinatarios, verifica un dominio en <a href="https://resend.com/domains">resend.com/domains</a>.</p>
        </div>
        ${emailContent}
      `;
      emailContent = testModeWarning;
    }
    
    // Preparar datos del email para Resend
    const emailData = {
      from: FROM_EMAIL,
      to: recipients,
      subject: IN_TEST_MODE ? `[PRUEBA] ${subject}` : subject,
      html: emailContent,
      // Agregar encabezados para rastreo
      headers: {
        "X-Entity-Ref-ID": logId
      },
      // Agregar etiquetas para mejor seguimiento
      tags: [
        { name: "source", value: "prlconecta" },
        { name: "category", value: "transactional" },
        { name: "mode", value: IN_TEST_MODE ? "test" : "production" }
      ]
    };
    
    logInfo("Intentando enviar email a:", recipients, requestId);
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
          recipients: originalRecipients, // Devolvemos los destinatarios originales
          actualRecipients: recipients,    // Y los destinatarios reales
          emailSent: true,
          requestId: logId,
          elapsedTime: `${elapsedTime}ms`,
          fromEmail: FROM_EMAIL,
          actualFromEmail: result.from,
          testMode: IN_TEST_MODE,
          senderDetails: {
            email: VERIFIED_EMAIL,
            name: FROM_NAME
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
