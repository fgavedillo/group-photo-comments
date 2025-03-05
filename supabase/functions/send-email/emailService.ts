
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { logger } from "./logger.ts";
import { SendEmailRequest } from "./types.ts";

// Initialize SMTP client with credentials from environment variables
const client = new SmtpClient();

export async function sendEmail(request: SendEmailRequest): Promise<any> {
  const { to, subject, html, cc, text, attachments, requestId } = request;
  
  try {
    logger.log(`[${requestId}] Connecting to SMTP server...`);
    
    // Retrieve credentials from environment
    const username = Deno.env.get("GMAIL_USER");
    const password = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Validate credentials
    if (!username || !password) {
      throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD environment variables are not set");
    }
    
    logger.log(`[${requestId}] Using email: ${username}`);
    logger.log(`[${requestId}] Password length: ${password.length} characters`);
    
    // Connect to Gmail SMTP
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: username,
      password: password,
    });
    
    // Start measuring time for performance tracking
    const startTime = Date.now();
    
    // Send the email
    logger.log(`[${requestId}] Sending email to ${to}${cc ? ` with CC: ${cc.join(', ')}` : ''}...`);
    
    // Configure email
    const sendConfig: any = {
      from: username,
      to: to,
      subject: subject,
    };
    
    // Add CC if provided
    if (cc && cc.length > 0) {
      sendConfig.cc = cc;
    }
    
    // Add either HTML or text content
    if (html) {
      sendConfig.html = html;
    } else if (text) {
      sendConfig.content = text;
    }
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      sendConfig.attachments = attachments.map(attachment => ({
        contentType: attachment.type,
        filename: attachment.filename,
        content: attachment.content,
        encoding: attachment.encoding || 'base64',
      }));
    }
    
    // Send the email
    const result = await client.send(sendConfig);
    
    // Calculate how long it took
    const elapsed = Date.now() - startTime;
    
    // Log success
    logger.log(`[${requestId}] Email enviado correctamente en ${elapsed}ms`);
    
    // Close the connection
    await client.close();
    
    // Return success result
    return { 
      success: true, 
      message: `Email enviado correctamente a ${to}`,
      elapsed: `${elapsed}ms`,
      messageId: result.messageId
    };
  } catch (error) {
    logger.error(`[${requestId}] Error enviando email:`, error);
    
    // Try to close the client connection on error
    try {
      await client.close();
    } catch (closeError) {
      logger.error(`[${requestId}] Error cerrando conexión SMTP:`, closeError);
    }
    
    // Format a more helpful error message
    let errorMessage = error.message || "Error desconocido al enviar correo";
    let detailedError = error.stack || errorMessage;
    
    // Check for common Gmail authentication issues
    if (errorMessage.includes("Username and Password not accepted")) {
      errorMessage = "Autenticación de Gmail fallida: credenciales no aceptadas";
      detailedError = `Error de autenticación con Gmail. Verifique que:
1. La cuenta tenga verificación en dos pasos activada
2. Esté usando una contraseña de aplicación válida (16 caracteres sin espacios)
3. La contraseña de aplicación sea correcta y esté actualizada
4. El correo electrónico en GMAIL_USER sea correcto

Error original: ${error.message}`;
    }
    
    // Re-throw with enhanced information
    const enhancedError = new Error(errorMessage);
    enhancedError.stack = detailedError;
    throw enhancedError;
  }
}
