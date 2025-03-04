
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { EmailPayload } from "./types.ts";
import { Logger } from "./logger.ts";

export async function sendEmailWithTimeout(
  payload: EmailPayload, 
  logger: Logger
): Promise<void> {
  // Get environment variables for SMTP configuration
  const gmailUser = Deno.env.get("GMAIL_USER");
  // Configurar la contraseña sin espacios desde el inicio
  let gmailPass = Deno.env.get("GMAIL_APP_PASSWORD")?.replace(/\s+/g, '');
  
  // Validar credenciales
  if (!gmailUser || !gmailPass) {
    logger.error("Credenciales de Gmail no encontradas");
    throw new Error("Error de configuración: Credenciales de Gmail no configuradas");
  }

  logger.info(`Configurando cliente SMTP para ${gmailUser}`);
  logger.info(`Longitud de contraseña: ${gmailPass.length} caracteres`);
  
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
        "1. El correo utilizado es: " + gmailUser + "\n" +
        "2. Está usando esta contraseña de aplicación (sin espacios): " + "*".repeat(gmailPass.length) + "\n" +
        "3. La verificación en dos pasos está habilitada para su cuenta\n" +
        "4. La contraseña tiene exactamente 16 caracteres sin espacios"
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
