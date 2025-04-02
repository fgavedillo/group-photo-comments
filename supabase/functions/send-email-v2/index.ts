import { serve } from "https://deno.land/std@0.175.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://jzmzjvtxcrxljnhhrjo.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || req.headers.get('Authorization')?.split('Bearer ')[1] || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Inicializar Resend
    const resend = new Resend(RESEND_API_KEY);

    // Obtener datos de la solicitud
    const { issue_id, email, custom_html } = await req.json();

    // Validar datos
    if (!issue_id && !custom_html) {
      return new Response(
        JSON.stringify({ error: 'Se requiere issue_id o custom_html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Se requiere un email de destino' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let html = custom_html;
    let subject = 'Mensaje de PRLconecta';
    
    // Si se proporciona issue_id, obtener datos de la incidencia
    if (issue_id && !custom_html) {
      // Obtener detalles de la incidencia
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .select('*')
        .eq('id', issue_id)
        .single();

      if (issueError || !issue) {
        return new Response(
          JSON.stringify({ error: `No se pudo encontrar la incidencia con ID ${issue_id}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Obtener imagen asociada, si existe
      const { data: imageData } = await supabase
        .from('issue_images')
        .select('image_url')
        .eq('issue_id', issue_id)
        .maybeSingle();

      // Crear el HTML del email
      subject = `Detalles de Incidencia #${issue.id} - PRLconecta`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Detalles de Incidencia</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              h1 { color: #2563eb; }
              .container { max-width: 600px; margin: 0 auto; }
              .info-row { margin-bottom: 15px; }
              .label { font-weight: bold; }
              .issue-image { max-width: 100%; border-radius: 8px; margin-top: 20px; }
              .footer { margin-top: 30px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Detalles de Incidencia #${issue.id}</h1>
              
              <div class="info-row">
                <p class="label">Descripción:</p>
                <p>${issue.message || 'Sin descripción'}</p>
              </div>
              
              <div class="info-row">
                <p class="label">Estado:</p>
                <p>${issue.status || 'Sin estado'}</p>
              </div>
              
              <div class="info-row">
                <p class="label">Área:</p>
                <p>${issue.area || 'No especificada'}</p>
              </div>
              
              <div class="info-row">
                <p class="label">Responsable:</p>
                <p>${issue.responsable || 'No asignado'}</p>
              </div>
              
              ${issue.security_improvement ? `
                <div class="info-row">
                  <p class="label">Mejora de seguridad:</p>
                  <p>${issue.security_improvement}</p>
                </div>
              ` : ''}
              
              ${issue.action_plan ? `
                <div class="info-row">
                  <p class="label">Plan de acción:</p>
                  <p>${issue.action_plan}</p>
                </div>
              ` : ''}
              
              ${imageData?.image_url ? `
                <p class="label">Imagen de la incidencia:</p>
                <img src="${imageData.image_url}" alt="Imagen de incidencia" class="issue-image" />
              ` : ''}
              
              <div class="footer">
                <p>Este es un email automático del sistema PRLconecta.</p>
                <p>Por favor, no responda a este email.</p>
                <p>Fecha: ${new Date().toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric'
                })}</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: 'PRLconecta <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Error al enviar email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado correctamente a ${email}`,
        id: data.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error en la función Edge:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error desconocido al procesar la solicitud" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 