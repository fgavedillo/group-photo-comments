
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

    // Format date in Spanish timezone
    const now = new Date().toLocaleString('es-ES', { 
      timeZone: 'Europe/Madrid',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const messageId = `${Date.now()}.${crypto.randomUUID()}@resend.dev`;

    const emailResponse = await resend.emails.send({
      from: "Sistema de Incidencias <notifications@resend.dev>",
      reply_to: "no-reply@resend.dev",
      to: [to],
      subject: `[Sistema de Incidencias] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
          </head>
          <body style="margin: 0; padding: 0; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: #f8f9fd;">
            <div style="display: none; line-height: 0; font-size: 0;">
              Notificación importante del Sistema de Incidencias - ${subject}
            </div>
            <table style="width: 100%; border-collapse: collapse; background-color: #f8f9fd;" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" style="padding: 24px;">
                  <table style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 32px;">
                        <h1 style="margin: 0 0 24px; font-size: 24px; line-height: 1.25; color: #1f2937;">
                          ${subject}
                        </h1>
                        <div style="margin: 24px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                          ${content}
                        </div>
                        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
                        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                          Mensaje enviado el ${now}.<br/>
                          Este es un mensaje automático del Sistema de Incidencias, por favor no responda a este correo.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
        "X-Message-ID": messageId,
        "List-Unsubscribe": `<mailto:unsubscribe@resend.dev?subject=unsubscribe_${messageId}>`,
        "Feedback-ID": `${Date.now()}:incidencias:resend`,
        "X-Priority": "1",
        "Importance": "high",
        "Message-ID": `<${messageId}>`,
      },
      tags: [
        {
          name: "category",
          value: "incidencias"
        },
        {
          name: "priority",
          value: "high"
        }
      ]
    });

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
