
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { issues } = await req.json();

    // Generate the email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reporte de Incidencias</h2>
        <p>Aquí está el resumen de las incidencias activas:</p>
        ${issues.map((issue: any) => `
          <div style="border: 1px solid #eee; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <p><strong>Mensaje:</strong> ${issue.message}</p>
            <p><strong>Estado:</strong> ${issue.status}</p>
            <p><strong>Área:</strong> ${issue.area || 'No especificada'}</p>
            <p><strong>Responsable:</strong> ${issue.responsable || 'No asignado'}</p>
            ${issue.security_improvement ? `<p><strong>Mejora de Seguridad:</strong> ${issue.security_improvement}</p>` : ''}
            ${issue.action_plan ? `<p><strong>Plan de Acción:</strong> ${issue.action_plan}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    const { data, error: emailError } = await resend.emails.send({
      from: "prevencionlingotes@gmail.com",
      to: "prevencionlingotes@gmail.com",
      subject: "Reporte de Incidencias Activas",
      html: emailContent,
    });

    if (emailError) throw emailError;

    console.log("Test report email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
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
