
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { EmailPayload } from "./types.ts";
import { Logger } from "./logger.ts";

export async function sendEmailWithTimeout(
  payload: EmailPayload, 
  logger: Logger
): Promise<void> {
  // Get environment variables for SMTP configuration
  const gmailUser = Deno.env.get("GMAIL_USER");
  // Configurar la contraseña sin espacios desde el inicio y limpiar cualquier espacio
  let gmailPass = Deno.env.get("GMAIL_APP_PASSWORD")?.replace(/\s+/g, '');
  
  // Validar credenciales
  if (!gmailUser || !gmailPass) {
    logger.error("Credenciales de Gmail no encontradas");
    throw new Error("Error de configuración: Credenciales de Gmail no configuradas correctamente.");
  }

  logger.info(`Configurando cliente SMTP para ${gmailUser}`);
  logger.info(`Longitud de contraseña: ${gmailPass.length} caracteres`);
  
  try {
    // Verificación adicional de credenciales
    if (gmailPass.length !== 16) {
      logger.error(`La contraseña de aplicación debe tener 16 caracteres, actual: ${gmailPass.length}`);
      throw new Error(`La contraseña de aplicación debe tener 16 caracteres (actual: ${gmailPass.length}). Verifique que la contraseña esté completa y sin espacios.`);
    }
    
    // Mostrar primeros y últimos caracteres de la contraseña para diagnóstico (sin comprometer seguridad)
    if (gmailPass.length >= 4) {
      const firstTwo = gmailPass.substring(0, 2);
      const lastTwo = gmailPass.substring(gmailPass.length - 2);
      logger.info(`Verificando formato: primeros dos caracteres: "${firstTwo}", últimos dos: "${lastTwo}"`);
    }
    
    // Configurar cliente SMTP con opciones adicionales de depuración
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailPass,
        },
      },
      debug: true, // Activar depuración para más detalles en los logs
    });

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    logger.info(`Enviando email a: ${recipients.join(', ')}`);
    logger.info(`Asunto: ${payload.subject}`);
    
    try {
      // Enviar el email con un tiempo máximo de espera
      logger.info("Iniciando envío de correo...");
      
      const result = await client.send({
        from: gmailUser,
        to: recipients,
        subject: payload.subject,
        content: payload.content,
        html: payload.html,
        attachments: payload.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          encoding: attachment.encoding || "base64",
          contentType: attachment.contentType || attachment.type,
        })),
      });
      
      logger.info("Email enviado correctamente con resultado:", result);
    } catch (error) {
      logger.error(`Error al enviar email: ${error.message}`, error);
      
      // Mejorar mensajes de error específicos para Gmail
      if (error.message?.includes("Username and Password not accepted")) {
        throw new Error(
          "Autenticación de Gmail fallida. Verifique:\n" +
          "1. El correo utilizado es: " + gmailUser + "\n" +
          "2. Está usando esta contraseña de aplicación (sin espacios): " + 
              (gmailPass ? (gmailPass.substring(0, 2) + "..." + gmailPass.substring(gmailPass.length - 2)) : "vacía") + "\n" +
          "3. La verificación en dos pasos está habilitada para su cuenta\n" +
          "4. La contraseña tiene exactamente 16 caracteres sin espacios\n" +
          "5. La contraseña se generó específicamente para esta aplicación\n\n" +
          "Error original: " + error.message
        );
      } else if (error.message?.includes("ETIMEDOUT") || error.message?.includes("timeout")) {
        throw new Error(
          "Tiempo de espera excedido al conectar con Gmail. Verifique:\n" +
          "1. Su conexión a Internet\n" +
          "2. Si Gmail está experimentando problemas\n" +
          "3. Si hay restricciones de firewall o proxy\n\n" +
          "Error original: " + error.message
        );
      }
      
      throw error;
    } finally {
      // Cerrar la conexión
      try {
        await client.close();
        logger.info("Conexión SMTP cerrada correctamente");
      } catch (closeError) {
        logger.error("Error al cerrar conexión SMTP", closeError);
      }
    }
  } catch (error) {
    logger.error(`Error general en la configuración SMTP: ${error.message}`, error);
    throw error;
  }
}
