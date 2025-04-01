
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Función invocada")
    const { userEmail, userName } = await req.json()
    console.log("Datos recibidos:", { userEmail, userName })

    const gmailUser = Deno.env.get("GMAIL_USER")
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD")
    const adminEmail = "fgavedillo@gmail.com"

    if (!gmailUser || !gmailPassword) {
      console.error("Credenciales faltantes:", { hasUser: !!gmailUser, hasPassword: !!gmailPassword })
      throw new Error("Credenciales de Gmail no configuradas")
    }

    console.log("Configurando transporte de email")
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })

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
    `

    console.log("Intentando enviar email a:", adminEmail)
    const emailResponse = await transporter.sendMail({
      from: `"Sistema de Gestión" <${gmailUser}>`,
      to: adminEmail,
      subject: "Nuevo Usuario Pendiente de Aprobación",
      html: emailContent
    })

    console.log("Email enviado exitosamente:", emailResponse)

    return new Response(
      JSON.stringify({ message: "Notificación enviada correctamente" }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    )

  } catch (error) {
    console.error("Error en la función notify-admin:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    )
  }
})
