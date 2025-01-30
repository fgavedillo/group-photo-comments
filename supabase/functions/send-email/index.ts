import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content } = await req.json();
    
    console.log("Received email request:", { to, subject, contentLength: content?.length });

    if (!to || !subject || !content) {
      throw new Error("Missing required fields: to, subject, or content");
    }

    // Extract base64 image from content if it exists
    let attachments = [];
    const imageMatch = content.match(/src="data:image\/[^;]+;base64,([^"]+)"/);
    if (imageMatch && imageMatch[1]) {
      attachments.push({
        filename: 'incidencia.jpg',
        content: imageMatch[1],
      });
      console.log("Added image attachment");
    }

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: content,
      attachments: attachments,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify(emailResponse),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: error
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 500
      }
    );
  }
});