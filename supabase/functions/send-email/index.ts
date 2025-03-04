import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string | string[];
  subject: string;
  content?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    type?: string;
  }>;
  requestId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Start timing and generate request ID if not provided
  const startTime = Date.now();
  let requestId: string;
  
  try {
    const payload = await req.json() as EmailPayload;
    requestId = payload.requestId || `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email function invoked`);
    
    // Validate required fields
    if (!payload.to || !payload.subject || (!payload.content && !payload.html)) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Missing required fields in payload:`, 
        JSON.stringify({
          hasTo: !!payload.to,
          hasSubject: !!payload.subject,
          hasContent: !!(payload.content || payload.html)
        })
      );
      throw new Error("Missing required fields: to, subject, and content or html");
    }

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Received email request for ${recipients.join(', ')}`);
    
    // Get environment variables for SMTP configuration
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Validate credentials
    if (!gmailUser || !gmailPass) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Gmail credentials missing or invalid`);
      throw new Error("Email configuration error: Gmail credentials missing");
    }

    // Log configuration details (without sensitive info)
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] SMTP Configuration: 
    - Server: smtp.gmail.com
    - Port: 465
    - User: ${gmailUser}
    - Using TLS: Yes
    - Debug mode: Enabled`);

    // Configure SMTP client with detailed logging
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Configuring SMTP client...`);
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

    // Log email payload size
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email payload:
    - Recipients: ${recipients.length}
    - Subject: ${payload.subject}
    - Content length: ${payload.content?.length || 0} chars
    - HTML length: ${payload.html?.length || 0} chars
    - Attachments: ${payload.attachments?.length || 0}`);
    
    // Log each recipient individually
    for (const recipient of recipients) {
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Preparing to send to: ${recipient}`);
    }
    
    // Send email with timeout handling and immediate timeout
    try {
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Attempting to send email via SMTP...`);
      
      // Create a promise with timeout
      const sendWithTimeout = async () => {
        const timeout = 30000; // 30 seconds timeout
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
          timeoutController.abort();
        }, timeout);

        try {
          // This will send the email
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
              contentType: attachment.type,
            })),
          });
          
          // Clear the timeout
          clearTimeout(timeoutId);
          return result;
        } catch (error) {
          // Clear the timeout
          clearTimeout(timeoutId);
          
          // If the error was caused by the abort controller, it's a timeout
          if (timeoutController.signal.aborted) {
            throw new Error("SMTP send operation timed out after 30s");
          }
          
          // Otherwise, rethrow the original error
          throw error;
        }
      };
      
      const result = await sendWithTimeout();
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] SMTP send result:`, result);
    } catch (smtpError) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] SMTP send error:`, smtpError);
      throw new Error(`SMTP error: ${smtpError.message}`);
    }

    // Close the connection
    try {
      await client.close();
      console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] SMTP connection closed successfully`);
    } catch (closeError) {
      console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error closing SMTP connection:`, closeError);
    }
    
    // Calculate elapsed time
    const elapsedTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [RequestID:${requestId}] Email sent successfully to ${recipients.join(", ")} in ${elapsedTime}ms`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        recipients: recipients,
        requestId: requestId,
        elapsedTime: `${elapsedTime}ms`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Use default request ID if we couldn't parse one from the payload
    requestId = requestId || `error-${Date.now()}`;
    
    // Calculate elapsed time for error case
    const elapsedTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [RequestID:${requestId}] Error sending email (${elapsedTime}ms):`, error);
    
    // Return detailed error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        details: "Por favor revise los logs para más detalles.",
        requestId: requestId,
        elapsedTime: `${elapsedTime}ms`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
