
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import nodemailer from "npm:nodemailer";

const gmailUser = Deno.env.get("GMAIL_USER");
const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
const adminEmail = "fgavedillo@gmail.com";

if (!gmailUser || !gmailPassword) {
  console.error("Gmail credentials are missing:", { gmailUser: !!gmailUser, gmailPassword: !!gmailPassword });
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
    const { userEmail, userName } = await req.json();
    console.log("Received request to notify admin about:", { userEmail, userName });

    // Guardar la solicitud en la base de datos
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('approval_requests')
      .insert({
        admin_email: adminEmail,
        status: 'pending',
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nuevo Usuario Pendiente de Aprobación</h2>
        <p>Se ha registrado un nuevo usuario en el sistema:</p>
        <ul>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Nombre:</strong> ${userName || 'No especificado'}</li>
        </ul>
        <p>Por favor, acceda al panel de administración para aprobar o rechazar al usuario.</p>
        <p style="color: #666;">Este es un mensaje automático del sistema.</p>
      </div>
    `;

    console.log("Attempting to send email to:", adminEmail);
    const emailResponse = await transporter.sendMail({
      from: `"Sistema de Gestión" <${gmailUser}>`,
      to: adminEmail,
      subject: "Nuevo Usuario Pendiente de Aprobación",
      html: emailContent
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Notificación enviada correctamente" }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error("Error in notify-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
