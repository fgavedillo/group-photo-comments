
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { EmailPayload } from "./types.ts";
import { Logger } from "./logger.ts";

export async function sendEmailWithTimeout(
  payload: EmailPayload, 
  logger: Logger
): Promise<void> {
  // Get environment variables for SMTP configuration
  const gmailUser = Deno.env.get("GMAIL_USER");
  let gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
  
  // Validate credentials
  if (!gmailUser || !gmailPass) {
    logger.error("Credenciales de Gmail no encontradas");
    throw new Error("Error de configuración: Credenciales de Gmail no configuradas");
  }

  // Eliminar espacios de la contraseña (error común)
  gmailPass = gmailPass.replace(/\s+/g, '');
  
  logger.info(`Configurando cliente SMTP para ${gmailUser}`);
  
  // Configurar cliente SMTP
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
    debug: true,
  });

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  logger.info(`Enviando email a: ${recipients.join(', ')}`);
  
  try {
    // Enviar el email con un tiempo máximo de espera
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
    
    logger.info("Email enviado correctamente");
  } catch (error) {
    logger.error(`Error al enviar email: ${error.message}`, error);
    
    if (error.message && error.message.includes("Username and Password not accepted")) {
      throw new Error(
        "Autenticación de Gmail fallida. Verifique:\n" +
        "1. El nombre de usuario es correcto\n" +
        "2. Está usando una contraseña de aplicación (no su contraseña normal)\n" +
        "3. La verificación en dos pasos está habilitada para su cuenta\n" +
        "4. La contraseña de aplicación se ingresó sin espacios"
      );
    }
    
    throw error;
  } finally {
    // Cerrar la conexión
    try {
      await client.close();
      logger.info("Conexión SMTP cerrada");
    } catch (closeError) {
      logger.error("Error al cerrar conexión SMTP", closeError);
    }
  }
}
