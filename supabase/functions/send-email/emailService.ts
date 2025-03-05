
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { logger } from "./logger.ts";
import { SendEmailRequest } from "./types.ts";

// Function to validate credentials
function validateCredentials(username: string | undefined, password: string | undefined, requestId: string): void {
  if (!username) {
    logger.error(`[${requestId}] GMAIL_USER no está configurado en las variables de entorno`);
    throw new Error("GMAIL_USER no está configurado");
  }
  
  if (!password) {
    logger.error(`[${requestId}] GMAIL_APP_PASSWORD no está configurado en las variables de entorno`);
    throw new Error("GMAIL_APP_PASSWORD no está configurado");
  }
  
  // Remove spaces in password - this is critical as the API may fail with spaces
  password = password.trim().replace(/\s+/g, '');
  
  if (password.length !== 16) {
    logger.error(`[${requestId}] La contraseña de aplicación debe tener exactamente 16 caracteres (longitud actual: ${password.length})`);
    throw new Error("La contraseña de aplicación debe tener exactamente 16 caracteres");
  }
  
  // Verify basic email format
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
    
    // Get credentials from environment
    const username = Deno.env.get("GMAIL_USER");
    let password = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Remove spaces in password - many errors come from here
    if (password) {
      password = password.trim().replace(/\s+/g, '');
    }
    
    // Validate credentials
    validateCredentials(username, password, requestId);
    
    // Diagnostic information about credentials
    logger.log(`[${requestId}] Usando email: ${username}`);
    logger.log(`[${requestId}] Longitud de la contraseña: ${password.length} caracteres`);
    
    // Start measuring time for performance tracking
    const startTime = Date.now();
    
    try {
      // Using the updated SMTP client that doesn't rely on Deno.writeAll
      logger.log(`[${requestId}] Configurando cliente SMTP...`);
      
      const client = new SmtpClient();
      
      logger.log(`[${requestId}] Conectando a Gmail...`);
      
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465,
        username: username!,
        password: password!,
      });
      
      logger.log(`[${requestId}] Conexión establecida, enviando correo...`);
      
      // Prepare email content
      const mailOptions = {
        from: username!,
        to: [to],
        subject: subject,
        content: text || "",
        html: html || undefined,
      };
      
      // Add CC if provided
      if (cc && cc.length > 0) {
        mailOptions.to = [...mailOptions.to, ...cc];
      }
      
      // Send the email
      logger.log(`[${requestId}] Enviando email con opciones:`, JSON.stringify({
        from: username,
        to: mailOptions.to,
        subject,
        hasHtml: !!html,
        hasText: !!text,
      }));
      
      const result = await client.send(mailOptions);
      await client.close();
      
      // Calculate how long it took
      const elapsed = Date.now() - startTime;
      
      // Log success
      logger.log(`[${requestId}] Email enviado correctamente en ${elapsed}ms`);
      
      // Return successful result
      return { 
        success: true, 
        message: `Email enviado correctamente a ${to}`,
        elapsed: `${elapsed}ms`,
        messageId: result?.messageId
      };
    } catch (smtpError) {
      logger.error(`[${requestId}] Error en el cliente SMTP:`, smtpError);
      throw smtpError;
    }
    
  } catch (error) {
    logger.error(`[${requestId}] Error enviando email:`, error);
    
    // Improve error message for common errors
    let errorMessage = error.message || "Error desconocido al enviar correo";
    let detailedError = error.stack || errorMessage;
    
    // Check for common Gmail authentication issues
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
    
    // Re-throw with improved information
    const enhancedError = new Error(errorMessage);
    enhancedError.stack = detailedError;
    throw enhancedError;
  }
}
