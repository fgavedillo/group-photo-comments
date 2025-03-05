
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { logger } from "./logger.ts";
import { SendEmailRequest } from "./types.ts";

// Inicializar cliente SMTP con credenciales de variables de entorno
const client = new SmtpClient();

export async function sendEmail(request: SendEmailRequest): Promise<any> {
  const { to, subject, html, cc, text, attachments, requestId } = request;
  
  try {
    logger.log(`[${requestId}] Conectando al servidor SMTP...`);
    
    // Obtener credenciales del entorno
    const username = Deno.env.get("GMAIL_USER");
    const password = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Validar credenciales
    if (!username || !password) {
      logger.error(`[${requestId}] Variables de entorno GMAIL_USER o GMAIL_APP_PASSWORD no configuradas`);
      throw new Error("Variables de entorno GMAIL_USER o GMAIL_APP_PASSWORD no configuradas");
    }
    
    logger.log(`[${requestId}] Usando email: ${username}`);
    logger.log(`[${requestId}] Longitud de la contraseña: ${password.length} caracteres`);
    
    // Conectar a Gmail SMTP
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: username,
      password: password,
    });
    
    // Comenzar a medir el tiempo para seguimiento de rendimiento
    const startTime = Date.now();
    
    // Enviar el correo
    logger.log(`[${requestId}] Enviando correo a ${to}${cc ? ` con CC: ${cc.join(', ')}` : ''}...`);
    
    // Configurar correo
    const sendConfig: any = {
      from: username,
      to: to,
      subject: subject,
    };
    
    // Agregar CC si se proporciona
    if (cc && cc.length > 0) {
      sendConfig.cc = cc;
    }
    
    // Agregar contenido HTML o texto
    if (html) {
      sendConfig.html = html;
    } else if (text) {
      sendConfig.content = text;
    }
    
    // Agregar archivos adjuntos si se proporcionan
    if (attachments && attachments.length > 0) {
      sendConfig.attachments = attachments.map(attachment => ({
        contentType: attachment.type,
        filename: attachment.filename,
        content: attachment.content,
        encoding: attachment.encoding || 'base64',
      }));
    }
    
    // Enviar el correo
    const result = await client.send(sendConfig);
    
    // Calcular cuánto tiempo tardó
    const elapsed = Date.now() - startTime;
    
    // Registrar éxito
    logger.log(`[${requestId}] Email enviado correctamente en ${elapsed}ms`);
    
    // Cerrar la conexión
    try {
      await client.close();
    } catch (closeError) {
      logger.error(`[${requestId}] Error no crítico cerrando conexión SMTP:`, closeError);
      // No propagamos este error ya que el email ya se envió
    }
    
    // Devolver resultado exitoso
    return { 
      success: true, 
      message: `Email enviado correctamente a ${to}`,
      elapsed: `${elapsed}ms`,
      messageId: result.messageId
    };
  } catch (error) {
    logger.error(`[${requestId}] Error enviando email:`, error);
    
    // Intentar cerrar la conexión del cliente en caso de error
    try {
      await client.close();
    } catch (closeError) {
      logger.error(`[${requestId}] Error cerrando conexión SMTP:`, closeError);
    }
    
    // Formatear un mensaje de error más útil
    let errorMessage = error.message || "Error desconocido al enviar correo";
    let detailedError = error.stack || errorMessage;
    
    // Verificar problemas comunes de autenticación de Gmail
    if (errorMessage.includes("Username and Password not accepted")) {
      errorMessage = "Autenticación de Gmail fallida: credenciales no aceptadas";
      detailedError = `Error de autenticación con Gmail. Verifique que:
1. La cuenta tenga verificación en dos pasos activada
2. Esté usando una contraseña de aplicación válida (16 caracteres sin espacios)
3. La contraseña de aplicación sea correcta y esté actualizada
4. El correo electrónico en GMAIL_USER sea correcto

Error original: ${error.message}`;
    }
    
    // Re-lanzar con información mejorada
    const enhancedError = new Error(errorMessage);
    enhancedError.stack = detailedError;
    throw enhancedError;
  }
}
