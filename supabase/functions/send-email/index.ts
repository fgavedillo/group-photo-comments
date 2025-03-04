
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

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("GMAIL_USER") || "",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        },
      },
    });

    // Format recipients
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    
    // Send email
    await client.send({
      from: Deno.env.get("GMAIL_USER") || "",
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

    // Close the connection
    await client.close();
    
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
    
    // Return error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
