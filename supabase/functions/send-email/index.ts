import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendPulseTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SENDPULSE_CLIENT_ID");
  const clientSecret = Deno.env.get("SENDPULSE_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    throw new Error("SendPulse credentials not configured");
  }

  const tokenResponse = await fetch("https://api.sendpulse.com/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to get SendPulse access token");
  }

  const data: SendPulseTokenResponse = await tokenResponse.json();
  return data.access_token;
}

async function sendEmail(accessToken: string, to: string, subject: string, html: string) {
  const response = await fetch("https://api.sendpulse.com/smtp/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: {
        html: html,
        text_content: html.replace(/<[^>]*>/g, ''),
        subject: subject,
        from: {
          name: "Sistema de Incidencias",
          email: "notificaciones@prlconecta.es"
        },
        to: [
          {
            name: to.split('@')[0],
            email: to
          }
        ]
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("SendPulse API error:", error);
    throw new Error("Failed to send email");
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, content } = await req.json();
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Send email
    const result = await sendEmail(accessToken, to, subject, content);

    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    );
  }
});