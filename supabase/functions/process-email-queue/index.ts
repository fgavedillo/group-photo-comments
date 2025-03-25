import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

async function sendEmail(request: any) {
  const { to, subject, html, cc } = request;
  
  try {
    const client = new SmtpClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: false,
        auth: {
          username: Deno.env.get("SMTP_USERNAME") || "",
          password: Deno.env.get("SMTP_PASSWORD") || "",
        },
      },
    });

    const emailConfig = {
      from: "Sistema de Gestión de Incidencias <noreply@example.com>",
      to: Array.isArray(to) ? to : [to],
      cc: cc,
      subject: subject,
      html: html,
    };

    await client.send(emailConfig);
    await client.close();
    
    return { success: true };
  } catch (error) {
    console.error("Error en la configuración del cliente SMTP:", error);
    throw error;
  }
}

const processQueue = async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Obtener emails pendientes
  const { data: pendingEmails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10);

  if (error) {
    console.error('Error al obtener emails pendientes:', error);
    return;
  }

  for (const email of pendingEmails) {
    try {
      await sendEmail({
        to: email.to_addresses,
        cc: email.cc_addresses,
        subject: email.subject,
        html: email.html_content,
      });

      // Actualizar registro
      await supabase
        .from('email_queue')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString(),
          last_success: new Date().toISOString(),
          ...(email.is_periodic && {
            status: 'pending',
            scheduled_for: calculateNextSchedule(email.period_type)
          })
        })
        .eq('id', email.id);

    } catch (error) {
      await supabase
        .from('email_queue')
        .update({
          status: 'error',
          error: error.message,
          retry_count: email.retry_count + 1,
          processed_at: new Date().toISOString()
        })
        .eq('id', email.id);
    }
  }
};

function calculateNextSchedule(periodType: string): Date {
  const now = new Date();
  switch (periodType) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1));
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7));
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    default:
      return now;
  }
}

// Ejecutar cada minuto
Deno.cron("process-email-queue", "* * * * *", processQueue); 