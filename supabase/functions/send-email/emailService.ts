
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { EmailPayload } from "./types.ts";
import { Logger } from "./logger.ts";

export async function sendEmailWithTimeout(
  payload: EmailPayload, 
  logger: Logger
): Promise<void> {
  // Get environment variables for SMTP configuration
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
  
  // Validate credentials
  if (!gmailUser || !gmailPass) {
    logger.error("Gmail credentials missing or invalid");
    throw new Error("Email configuration error: Gmail credentials missing");
  }

  try {
    // Verify the format of Gmail user to ensure it's a valid email
    if (!gmailUser.includes("@") || !gmailUser.includes(".")) {
      logger.error(`Invalid Gmail username format: ${gmailUser}`);
      throw new Error("Invalid Gmail username format. Must be a valid email address.");
    }

    // Log redacted credentials for debugging (showing only partial info)
    const redactedPass = gmailPass ? "*".repeat(Math.min(gmailPass.length, a)) : "not set";
    logger.info(`SMTP Configuration: 
    - Server: smtp.gmail.com
    - Port: 465
    - User: ${gmailUser}
    - Password: ${redactedPass.substring(0, 3)}*** (${gmailPass.length} chars)
    - Using TLS: Yes
    - Debug mode: Enabled`);
  } catch (e) {
    logger.error("Error validating Gmail credentials: ", e);
    throw new Error(`Error validating Gmail credentials: ${e.message}`);
  }

  // Configure SMTP client with detailed logging
  logger.info("Configuring SMTP client...");
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
    debug: true, // Enable debug mode for detailed logs
  });

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  
  // Log email payload size
  logger.info(`Email payload:
  - Recipients: ${recipients.length}
  - Subject: ${payload.subject}
  - Content length: ${payload.content?.length || 0} chars
  - HTML length: ${payload.html?.length || 0} chars
  - Attachments: ${payload.attachments?.length || 0}`);
  
  // Log each recipient individually
  for (const recipient of recipients) {
    logger.info(`Preparing to send to: ${recipient}`);
  }
  
  // Create a promise with timeout
  const timeout = 30000; // 30 seconds timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeout);

  try {
    // This will send the email
    logger.info("Attempting to send email via SMTP...");
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
    
    logger.info("SMTP send result:", result);
  } catch (smtpError) {
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // If the error was caused by the abort controller, it's a timeout
    if (timeoutController.signal.aborted) {
      logger.error("SMTP send operation timed out after 30s");
      throw new Error("SMTP send operation timed out after 30s");
    }
    
    // Provide more helpful error messages for common SMTP errors
    if (smtpError.message && smtpError.message.includes("Username and Password not accepted")) {
      logger.error("Authentication failed: Gmail username and password not accepted", smtpError);
      throw new Error(
        "Gmail authentication failed. Please check: \n" +
        "1. Your Gmail username is correct\n" +
        "2. You're using an App Password (not your regular password)\n" +
        "3. 2-Step Verification is enabled for your Google account\n" +
        "4. The App Password was generated specifically for this application\n" +
        "5. The App Password was entered without spaces\n" +
        "For more information: https://support.google.com/mail/?p=BadCredentials"
      );
    } else if (smtpError.message && (
      smtpError.message.includes("Client was not authenticated") || 
      smtpError.message.includes("Credentials rejected")
    )) {
      logger.error("Authentication failed with other error:", smtpError);
      throw new Error(
        "Gmail authentication failed. Your credentials were rejected. Please check:\n" +
        "1. You have set up 2-Step Verification in your Google account\n" +
        "2. You have created an App Password specifically for this application\n" +
        "3. You are using the App Password (16-character code) not your Gmail password\n" +
        "4. The App Password was entered exactly, without spaces\n" +
        "Follow the guide at: https://support.google.com/accounts/answer/185833"
      );
    }
    
    logger.error("SMTP send error:", smtpError);
    throw new Error(`SMTP error: ${smtpError.message}`);
  } finally {
    // Clear the timeout if not already cleared
    clearTimeout(timeoutId);
    
    // Close the connection
    try {
      await client.close();
      logger.info("SMTP connection closed successfully");
    } catch (closeError) {
      logger.error("Error closing SMTP connection:", closeError);
    }
  }
}
