
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { logger } from "./logger.ts";
import { SendEmailRequest } from "./types.ts";

// Función para validar credenciales de correo
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
    
    // Eliminar espacios en la contraseña - muchos errores vienen de aquí
    if (password) {
      password = password.trim().replace(/\s+/g, '');
    }
    
    // Validar credenciales
    validateCredentials(username, password, requestId);
    
    // Información de diagnóstico sobre las credenciales
    logger.log(`[${requestId}] Usando email: ${username}`);
    logger.log(`[${requestId}] Longitud de la contraseña: ${password.length} caracteres`);
    
    // Comenzar a medir el tiempo para seguimiento de rendimiento
    const startTime = Date.now();
    
    // En lugar de usar la biblioteca SMTP con problemas, usaremos la API de Gmail
    // directamente a través de una solicitud HTTP
    const emailUrl = 'https://smtps.gmail.com/send';
    
    // Cambio de estrategia: Vamos a usar Resend.com como servicio de correo
    // ya que Gmail SMTP está dando problemas con Deno
    logger.log(`[${requestId}] Usando servicio alternativo para envío de correo...`);
    
    // Configurar parámetros para el correo
    const emailContent: any = {
      from: username,
      to: to,
      subject: subject,
    };
    
    // Agregar contenido HTML o texto
    if (html) emailContent.html = html;
    if (text) emailContent.text = text;
    
    // Agregar CC si se proporciona
    if (cc && cc.length > 0) {
      emailContent.cc = cc;
    }
    
    // Usar una solución alternativa más simple para enviar correos
    // Este es un enfoque que no dependerá de Deno.writeAll
    const tls = { servername: "smtp.gmail.com" };
    const client = new SmtpClient({ connection: { hostname: "smtp.gmail.com", port: 465, tls: true } });
    
    logger.log(`[${requestId}] Conectando a Gmail usando nuevo método...`);
    
    await client.connect({
      hostname: "smtp.gmail.com",
      port: 465,
      username: username!,
      password: password!,
    });
    
    logger.log(`[${requestId}] Conexión establecida, enviando correo...`);
    
    const mailOptions = {
      from: username!,
      to: to,
      subject: subject,
      content: text || "",
      html: html || undefined,
    };
    
    // Enviar el correo
    const result = await client.send(mailOptions);
    await client.close();
    
    // Calcular cuánto tiempo tardó
    const elapsed = Date.now() - startTime;
    
    // Registrar éxito
    logger.log(`[${requestId}] Email enviado correctamente en ${elapsed}ms`);
    
    // Devolver resultado exitoso
    return { 
      success: true, 
      message: `Email enviado correctamente a ${to}`,
      elapsed: `${elapsed}ms`,
      messageId: result.messageId
    };
    
  } catch (error) {
    logger.error(`[${requestId}] Error enviando email:`, error);
    
    // Mejorar el mensaje de error para errores comunes
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
    
    // Re-lanzar con información mejorada
    const enhancedError = new Error(errorMessage);
    enhancedError.stack = detailedError;
    throw enhancedError;
  }
}
