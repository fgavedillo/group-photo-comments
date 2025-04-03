
// Importamos la nueva biblioteca smtp2 que es más moderna y compatible
import { SmtpClient } from "https://deno.land/x/smtp2@0.4.0/mod.ts";
import { logger } from "./logger.ts";
import { SendEmailRequest } from "./types.ts";

// Función para validar credenciales
function validateCredentials(username: string | undefined, password: string | undefined, requestId: string): void {
  if (!username) {
    logger.error(`[${requestId}] GMAIL_USER no está configurado en las variables de entorno`);
    throw new Error("GMAIL_USER no está configurado");
  }
  
  if (!password) {
    logger.error(`[${requestId}] GMAIL_APP_PASSWORD no está configurado en las variables de entorno`);
    throw new Error("GMAIL_APP_PASSWORD no está configurado");
  }
  
  // Eliminar espacios en la contraseña - esto es crítico ya que la API puede fallar con espacios
  password = password.trim().replace(/\s+/g, '');
  
  if (password.length !== 16) {
    logger.error(`[${requestId}] La contraseña de aplicación debe tener exactamente 16 caracteres (longitud actual: ${password.length})`);
    throw new Error("La contraseña de aplicación debe tener exactamente 16 caracteres");
  }
  
  // Verificar formato básico de email
  if (!username.includes('@')) {
    logger.error(`[${requestId}] GMAIL_USER no parece ser una dirección de correo válida: ${username}`);
    throw new Error("GMAIL_USER no parece ser una dirección de correo válida");
  }
  
  logger.log(`[${requestId}] Credenciales validadas correctamente`);
}

export async function sendEmail(request: SendEmailRequest): Promise<any> {
  const { to, subject, html, cc, text, attachments, requestId } = request;
  
  try {
    logger.log(`[${requestId}] Iniciando envío de correo a ${to}`);
    
    // Obtener credenciales del entorno
    const username = Deno.env.get("GMAIL_USER");
    let password = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Eliminar espacios en la contraseña - muchos errores provienen de aquí
    if (password) {
      password = password.trim().replace(/\s+/g, '');
    }
    
    // Validar credenciales
    validateCredentials(username, password, requestId);
    
    // Información de diagnóstico sobre credenciales
    logger.log(`[${requestId}] Usando email: ${username}`);
    logger.log(`[${requestId}] Longitud de la contraseña: ${password.length} caracteres`);
    
    // Medir tiempo para seguimiento de rendimiento
    const startTime = Date.now();
    
    try {
      // Configurar cliente SMTP con la nueva biblioteca
      logger.log(`[${requestId}] Configurando cliente SMTP con la nueva biblioteca smtp2...`);
      
      // Crear cliente con la nueva biblioteca, que tiene mejor compatibilidad con Deno actual
      const client = new SmtpClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: {
            username: username!,
            password: password!,
          }
        }
      });
      
      logger.log(`[${requestId}] Cliente SMTP configurado, preparando envío de correo...`);
      
      // Preparar contenido del email con la nueva estructura de la biblioteca
      const mailOptions = {
        from: username!,
        to: Array.isArray(to) ? to : [to], // Asegurar que 'to' sea un array
        subject: subject,
        content: text || "",
        html: html || undefined,
      };
      
      // Añadir CC si se proporciona
      if (cc && cc.length > 0) {
        mailOptions.to = [...mailOptions.to, ...cc];
      }
      
      logger.log(`[${requestId}] Enviando email con la nueva biblioteca...`);
      
      // Enviar el correo con la nueva API que no usa Deno.writeAll
      const result = await client.send(mailOptions);
      
      // Calcular cuánto tiempo tomó
      const elapsed = Date.now() - startTime;
      
      // Registrar éxito
      logger.log(`[${requestId}] Email enviado correctamente con la nueva biblioteca en ${elapsed}ms`);
      
      // Devolver resultado exitoso
      return { 
        success: true, 
        message: `Email enviado correctamente a ${to}`,
        elapsed: `${elapsed}ms`,
        messageId: result?.messageId || `msg-${Date.now()}`
      };
    } catch (smtpError) {
      logger.error(`[${requestId}] Error en el cliente SMTP nuevo:`, smtpError);
      
      // Hacer diagnóstico específico para errores comunes de Gmail
      let errorMessage = smtpError.message || "Error desconocido al enviar correo";
      let errorDetails = smtpError.stack || errorMessage;
      
      if (errorMessage.includes("authentication") || errorMessage.includes("auth") || errorMessage.includes("535")) {
        errorMessage = "Error de autenticación con Gmail";
        errorDetails = `Problemas con la autenticación en Gmail. Verifique:
1. Que su cuenta tenga verificación en dos pasos activada
2. Que esté usando una contraseña de aplicación correcta (16 caracteres sin espacios)
3. Que el email (${username}) sea correcto

Error técnico: ${smtpError.message}`;
      }
      
      // Mejorar el mensaje de error original para facilitar el diagnóstico
      const enhancedError = new Error(errorMessage);
      enhancedError.stack = errorDetails;
      throw enhancedError;
    }
    
  } catch (error) {
    logger.error(`[${requestId}] Error enviando email:`, error);
    
    // Mejorar mensaje de error para errores comunes
    let errorMessage = error.message || "Error desconocido al enviar correo";
    let detailedError = error.stack || errorMessage;
    
    // Verificar problemas comunes de autenticación de Gmail
    if (errorMessage.includes("Username and Password not accepted") || 
        errorMessage.includes("535-5.7.8")) {
      errorMessage = "Autenticación de Gmail fallida: credenciales no aceptadas";
      detailedError = `Error de autenticación con Gmail. Verifique que:
1. La cuenta tenga verificación en dos pasos activada
2. Esté usando una contraseña de aplicación válida (16 caracteres sin espacios)
3. La contraseña de aplicación sea correcta y esté actualizada
4. El correo electrónico en GMAIL_USER sea correcto

Error original: ${error.message}`;
    }
    
    // Buscar errores relacionados con compatibilidad
    if (errorMessage.includes("writeAll") || detailedError.includes("writeAll") || 
        errorMessage.includes("not a function") || errorMessage.includes("undefined")) {
      errorMessage = "Error de compatibilidad en la biblioteca SMTP";
      detailedError = `Error de compatibilidad detectado. Este error debería estar resuelto con la nueva biblioteca.
Si persiste, por favor reporte el problema con los detalles técnicos.

Error original: ${error.message}`;
    }
    
    // Relanzar con información mejorada
    const enhancedError = new Error(errorMessage);
    enhancedError.stack = detailedError;
    throw enhancedError;
  }
}
