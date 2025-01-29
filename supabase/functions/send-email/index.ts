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
    console.error("Credenciales faltantes - Client ID:", !!clientId, "Secret:", !!clientSecret);
    throw new Error("Credenciales de SendPulse no configuradas");
  }

  console.log("Intentando obtener token de SendPulse...");
  console.log("Client ID disponible:", !!clientId);
  console.log("Client Secret disponible:", !!clientSecret);
  
  try {
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
      const errorText = await tokenResponse.text();
      console.error("Error al obtener token. Status:", tokenResponse.status);
      console.error("Respuesta de error:", errorText);
      throw new Error(`Error al obtener token de SendPulse: ${errorText}`);
    }

    const data: SendPulseTokenResponse = await tokenResponse.json();
    console.log("Token obtenido exitosamente");
    return data.access_token;
  } catch (error) {
    console.error("Error en getAccessToken:", error);
    throw error;
  }
}

async function sendEmail(accessToken: string, to: string, subject: string, html: string) {
  console.log("Intentando enviar email a:", to);
  
  try {
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
            email: "whatsapp@prlconecta.es"
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
      console.error("Error de API SendPulse:", error);
      throw new Error(`Error al enviar email: ${error}`);
    }

    const result = await response.json();
    console.log("Email enviado exitosamente:", result);
    return result;
  } catch (error) {
    console.error("Error en sendEmail:", error);
    throw error;
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando procesamiento de solicitud de email");
    const { to, subject, content } = await req.json();
    
    console.log("Datos recibidos:", { to, subject, contentLength: content?.length });
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Send email
    const result = await sendEmail(accessToken, to, subject, content);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    );
  } catch (error: any) {
    console.error('Error en la función send-email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': "application/json" },
        status: 500
      },
    );
  }
});