
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content, attachments } = await req.json();
    
    console.log("Received email request:", { to, subject, contentLength: content?.length });

    if (!to || !subject || !content) {
      throw new Error("Missing required fields: to, subject, or content");
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: "prevencionlingotes@gmail.com",
          password: Deno.env.get("GMAIL_APP_PASSWORD") || "",
        },
      },
    });

    console.log("Attempting to send email...");

    const emailResponse = await client.send({
      from: "Sistema de Incidencias <prevencionlingotes@gmail.com>",
      to: [to],
      subject: `Sistema de Incidencias: ${subject}`,
      html: content,
      attachments,
    });

    await client.close();

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
