import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log para debug
    console.log('Headers recibidos:', Object.fromEntries(req.headers.entries()));

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No se encontró header de autorización');
      throw new Error('Missing authorization header');
    }

    // Crear cliente de Supabase con el token del usuario
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar el token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Error de autenticación:', userError);
      throw new Error('Usuario no autorizado');
    }

    // Obtener configuración de email
    const { data: emailConfig, error: configError } = await supabase
      .from('email_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !emailConfig) {
      console.error('Error al obtener config:', configError);
      throw new Error('Configuración de email no encontrada');
    }

    // Log para debug
    console.log('Configuración encontrada:', {
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      username: emailConfig.smtp_username
    });

    const client = new SmtpClient({
      connection: {
        hostname: emailConfig.smtp_host,
        port: emailConfig.smtp_port,
        tls: emailConfig.use_tls,
        auth: {
          username: emailConfig.smtp_username,
          password: emailConfig.smtp_password,
        },
      },
    });

    const { to, subject, html } = await req.json();
    console.log('Enviando email a:', to);

    await client.send({
      from: emailConfig.from_email,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email enviado correctamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error detallado:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        message: error.message,
        details: error.toString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message.includes('authorization') ? 401 : 500,
    });
  }
}); 