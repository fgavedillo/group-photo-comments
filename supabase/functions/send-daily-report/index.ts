
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "./config.ts";
import { calculateKPIs, getDistributionData, formatDate } from "./utils.ts";
import { generateEmailContent } from "./email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const kpis = calculateKPIs(issues);
    const distribution = getDistributionData(issues);
    const emailContent = generateEmailContent(issues, kpis, distribution);
    const today = formatDate();

    const emailResponse = await resend.emails.send({
      from: "Incidencias <incidencias@resend.dev>",
      to: ["prevencionlingotes@gmail.com"],
      subject: `Reporte Diario de Incidencias - ${today}`,
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
