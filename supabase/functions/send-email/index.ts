
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as EmailPayload;
    
    // Validate required fields
    if (!payload.to || !payload.subject || (!payload.content && !payload.html)) {
      throw new Error("Missing required fields: to, subject, and content or html");
    }

    console.log(`Received email request for ${typeof payload.to === 'string' ? payload.to : payload.to.join(', ')}`);
    
    // Get environment variables for SMTP configuration
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
    
    // Validate credentials
    if (!gmailUser || !gmailPass) {
      console.error("Gmail credentials missing");
      throw new Error("Email configuration error: Gmail credentials missing");
    }

    // Configure SMTP client with detailed logging
    console.log("Configuring SMTP client...");
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

    // Format recipients
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    console.log(`Sending email to: ${recipients.join(", ")}`);
    
    // Send email
    try {
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
      
      console.log("SMTP send result:", result);
    } catch (smtpError) {
      console.error("SMTP send error:", smtpError);
      throw new Error(`SMTP error: ${smtpError.message}`);
    }

    // Close the connection
    try {
      await client.close();
      console.log("SMTP connection closed");
    } catch (closeError) {
      console.error("Error closing SMTP connection:", closeError);
    }
    
    console.log(`Email sent successfully to ${recipients.join(", ")}`);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    // Return detailed error response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        details: "Por favor revise los logs para más detalles."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
