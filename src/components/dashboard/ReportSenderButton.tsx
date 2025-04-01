
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendIssuesSummary } from '@/services/emailService';
import { Issue } from '@/types/issue';

export function ReportSenderButton() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleSendReport = async () => {
    try {
      setIsSending(true);

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

      // Verificar que hay emails asignados
      const assignedEmails = issues
        .map(issue => issue.assignedEmail)
        .filter(email => email && email.includes('@'));

      if (assignedEmails.length === 0) {
        toast({
          title: "Sin destinatarios",
          description: "No hay emails asignados a las incidencias abiertas",
          variant: "destructive",
        });
        return;
      }

      // Enviar el resumen por email
      await sendIssuesSummary(issues as Issue[]);

      toast({
        title: "Resumen enviado",
        description: `Email enviado correctamente a ${assignedEmails.length} destinatarios`,
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
