
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        issue_images (
          image_url
        )
      `)
      .in('status', ['en-estudio', 'en-curso'])
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const issuesTable = issues.map(issue => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${issue.id}</td>
        <td style="padding: 12px;">${issue.message}</td>
        <td style="padding: 12px;">${issue.security_improvement || '-'}</td>
        <td style="padding: 12px;">
          <span style="
            background-color: ${issue.status === 'en-curso' ? '#FFA500' : '#808080'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
          ">
            ${issue.status}
          </span>
        </td>
        <td style="padding: 12px;">
          ${issue.issue_images?.[0]?.image_url ? 
            `<img src="${issue.issue_images[0].image_url}" 
                  alt="Incidencia" 
                  style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
            />` : 
            '-'
          }
        </td>
      </tr>
    `).join('');

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #333;">Reporte de Incidencias Activas</h1>
        <p style="color: #666;">Resumen de incidencias en estudio y en curso al ${new Date().toLocaleDateString('es-ES')}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 12px; text-align: left;">ID</th>
              <th style="padding: 12px; text-align: left;">Que Sucede</th>
              <th style="padding: 12px; text-align: left;">Mejora de Seguridad</th>
              <th style="padding: 12px; text-align: left;">Estado</th>
              <th style="padding: 12px; text-align: left;">Imagen</th>
            </tr>
          </thead>
          <tbody>
            ${issuesTable}
          </tbody>
        </table>
        
        <p style="color: #999; margin-top: 20px; font-size: 0.9em;">
          Este es un reporte automático del sistema de gestión de incidencias.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: ["fgavedillo@gmail.com"],
      subject: "Reporte de Incidencias Activas",
      html: emailContent,
    });

    console.log("Test report email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  } catch (error: any) {
    console.error("Error in send-test-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
