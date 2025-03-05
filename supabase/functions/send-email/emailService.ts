
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
  password = password.replace(/\s+/g, '');
  
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
  const client = new SmtpClient();
  
  try {
    logger.log(`[${requestId}] Iniciando envío de correo a ${to}`);
    
    // Obtener credenciales del entorno
    const username = Deno.env.get("GMAIL_USER");
    let password = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Eliminar espacios en la contraseña - muchos errores vienen de aquí
    if (password) {
      password = password.replace(/\s+/g, '');
    }
    
    // Validar credenciales
    validateCredentials(username, password, requestId);
    
    // Información de diagnóstico sobre las credenciales
    logger.log(`[${requestId}] Usando email: ${username}`);
    logger.log(`[${requestId}] Longitud de la contraseña: ${password.length} caracteres`);
    
    // Conectar a Gmail SMTP con timeout
    logger.log(`[${requestId}] Conectando al servidor SMTP...`);
    
    try {
      const connectTimeout = setTimeout(() => {
        throw new Error("Tiempo de espera excedido al conectar con el servidor SMTP");
      }, 15000); // 15 segundos de timeout
      
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465,
        username: username!,
        password: password!,
      });
      
      clearTimeout(connectTimeout);
      logger.log(`[${requestId}] Conexión SMTP establecida correctamente`);
    } catch (connectError) {
      logger.error(`[${requestId}] Error conectando al servidor SMTP:`, connectError);
      
      if (connectError.message?.includes("Socket") || connectError.message?.includes("network")) {
        throw new Error(`Error de red conectando a smtp.gmail.com:465 - ${connectError.message}`);
      } else if (connectError.message?.includes("auth") || connectError.message?.includes("535")) {
        throw new Error(`Error de autenticación: Credenciales no aceptadas por Gmail. Verifique su usuario y contraseña de aplicación (asegúrese de que no tenga espacios)`);
      } else {
        throw connectError;
      }
    }
    
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
    
    // Enviar el correo con timeout
    let result;
    try {
      const sendTimeout = setTimeout(() => {
        throw new Error("Tiempo de espera excedido al enviar el correo");
      }, 30000); // 30 segundos de timeout
      
      result = await client.send(sendConfig);
      clearTimeout(sendTimeout);
    } catch (sendError) {
      logger.error(`[${requestId}] Error durante el envío del correo:`, sendError);
      throw new Error(`Error enviando correo: ${sendError.message}`);
    }
    
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
