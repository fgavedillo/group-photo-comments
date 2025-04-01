
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Issue } from '@/types/issue';

export function ReportSenderButton() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleSendReport = async () => {
    try {
      setIsSending(true);
      console.log('Iniciando envío de resumen...');

      // Obtener incidencias abiertas
      const { data: issues, error: supabaseError } = await supabase
        .from('issues')
        .select('*')
        .in('status', ['en-estudio', 'en-curso']);

      if (supabaseError) {
        console.error('Error al obtener incidencias:', supabaseError);
        throw new Error('No se pudieron obtener las incidencias de la base de datos');
      }

      if (!issues || issues.length === 0) {
        toast({
          title: "Sin incidencias",
          description: "No hay incidencias abiertas para enviar en el resumen",
        });
        return;
      }

      console.log('Incidencias obtenidas:', issues.length);

      // Verificar que hay emails asignados
      const assignedEmails = issues
        .map(issue => issue.assigned_email)
        .filter(email => email && email.includes('@'));

      if (assignedEmails.length === 0) {
        toast({
          title: "Sin destinatarios",
          description: "No hay emails asignados a las incidencias abiertas",
          variant: "destructive",
        });
        return;
      }

      console.log('Emails asignados encontrados:', assignedEmails);

      // Transformar los datos para que coincidan con el formato esperado por la edge function
      const formattedIssues = issues.map(issue => ({
        id: issue.id,
        message: issue.message,
        timestamp: issue.timestamp,
        username: issue.username,
        status: issue.status,
        securityImprovement: issue.security_improvement,
        actionPlan: issue.action_plan,
        assignedEmail: issue.assigned_email,
        area: issue.area,
        responsable: issue.responsable,
        user_id: issue.user_id,
        url_key: issue.url_key
      }));

      console.log('Llamando a la edge function para enviar el email...');
      
      // Llamar a la edge function
      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: { issues: formattedIssues }
      });

      if (error) {
        console.error('Error al llamar a la edge function:', error);
        throw new Error(`Error al enviar el email: ${error.message}`);
      }

      console.log('Respuesta de la edge function:', data);

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al enviar el email');
      }

      toast({
        title: "Resumen enviado",
        description: data.message || `Email enviado correctamente a ${assignedEmails.length} destinatarios`,
      });
    } catch (error) {
      console.error('Error detallado:', error);
      toast({
        title: "Error al enviar",
        description: error instanceof Error ? error.message : "No se pudo enviar el resumen de incidencias",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      onClick={handleSendReport}
      disabled={isSending}
      className="flex items-center gap-2"
    >
      <Mail className="h-4 w-4" />
      {isSending ? "Enviando..." : "Enviar resumen"}
    </Button>
  );
}
