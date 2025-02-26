
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Obtener las incidencias activas
    const { data: issues, error: issuesError } = await supabaseClient
      .from('issues')
      .select(`
        *,
        issue_images (image_url)
      `)
      .in('status', ['en-estudio', 'en-curso'])
      .order('timestamp', { ascending: false });

    if (issuesError) throw issuesError;

    if (!issues || issues.length === 0) {
      console.log('No hay incidencias activas para reportar');
      return new Response(
        JSON.stringify({ message: 'No hay incidencias activas para reportar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar el contenido HTML del reporte
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Reporte Diario de Incidencias</h1>
        <p>A continuación se presenta el resumen de las incidencias activas:</p>
        
        ${issues.map(issue => `
          <div style="border: 1px solid #e5e7eb; padding: 16px; margin: 16px 0; border-radius: 8px;">
            <h3 style="color: #1f2937; margin-top: 0;">Incidencia #${issue.id}</h3>
            <p style="color: #4b5563;"><strong>Estado:</strong> ${issue.status}</p>
            <p style="color: #4b5563;"><strong>Mensaje:</strong> ${issue.message}</p>
            ${issue.area ? `<p style="color: #4b5563;"><strong>Área:</strong> ${issue.area}</p>` : ''}
            ${issue.responsable ? `<p style="color: #4b5563;"><strong>Responsable:</strong> ${issue.responsable}</p>` : ''}
            ${issue.issue_images && issue.issue_images[0] ? 
              `<img src="${issue.issue_images[0].image_url}" style="max-width: 300px; border-radius: 4px;" />` : 
              ''
            }
          </div>
        `).join('')}
      </div>
    `;

    // Configurar el cliente SMTP
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

    // Enviar el correo
    const emailResponse = await client.send({
      from: "Sistema de Incidencias <prevencionlingotes@gmail.com>",
      to: ["prevencionlingotes@gmail.com"],
      subject: "Reporte Diario de Incidencias",
      html: htmlContent,
    });

    await client.close();

    console.log("Reporte diario enviado exitosamente:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Reporte enviado exitosamente" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Error enviando el reporte diario:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
