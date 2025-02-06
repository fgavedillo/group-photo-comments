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
      .select('*')
      .in('status', ['en-estudio', 'en-curso']);

    if (error) throw error;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'en-curso':
          return '#FFA500';
        default:
          return '#808080';
      }
    };

    const issuesTable = issues.map(issue => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${issue.id}</td>
        <td style="padding: 12px;">${issue.message}</td>
        <td style="padding: 12px;">
          <span style="
            background-color: ${getStatusColor(issue.status)};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
          ">
            ${issue.status}
          </span>
        </td>
        <td style="padding: 12px;">${new Date(issue.timestamp).toLocaleDateString('es-ES')}</td>
        <td style="padding: 12px;">${issue.area || '-'}</td>
        <td style="padding: 12px;">${issue.responsable || '-'}</td>
      </tr>
    `).join('');

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #333;">Reporte Diario de Incidencias</h1>
        <p style="color: #666;">Resumen de incidencias abiertas y en curso al ${new Date().toLocaleDateString('es-ES')}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f8f8;">
              <th style="padding: 12px; text-align: left;">ID</th>
              <th style="padding: 12px; text-align: left;">Descripción</th>
              <th style="padding: 12px; text-align: left;">Estado</th>
              <th style="padding: 12px; text-align: left;">Fecha</th>
              <th style="padding: 12px; text-align: left;">Área</th>
              <th style="padding: 12px; text-align: left;">Responsable</th>
            </tr>
          </thead>
          <tbody>
            ${issuesTable}
          </tbody>
        </table>
        
        <p style="color: #999; margin-top: 20px; font-size: 0.9em;">
          Este es un mensaje automático del sistema de gestión de incidencias.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: ["fgavedillo@gmail.com"],
      subject: "Reporte Diario de Incidencias",
      html: emailContent,
    });

    console.log("Daily report email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  } catch (error: any) {
    console.error("Error in send-daily-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});