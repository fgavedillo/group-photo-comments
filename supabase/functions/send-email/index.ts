
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const gmailUser = Deno.env.get("GMAIL_USER");
const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

if (!gmailUser || !gmailPassword) {
  throw new Error("Gmail credentials are not configured");
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPassword,
  },
});

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

    const emailResponse = await transporter.sendMail({
      from: gmailUser,
      to: [to],
      subject: `Sistema de Incidencias: ${subject}`,
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
              Notificación del Sistema de Incidencias - ${subject}
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
                          Este es un mensaje automático del Sistema de Incidencias.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `
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
