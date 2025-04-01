
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Issue } from '@/types/issue';
import { useIssues } from '@/hooks/useIssues';
import { useMessages } from '@/hooks/useMessages';

export function ReportSenderButton() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const { issues } = useIssues();
  const { messages } = useMessages();

  const handleSendReport = async () => {
    try {
      setIsSending(true);
      console.log('Iniciando envío de resumen...');

      // Obtener incidencias abiertas
      const { data: openIssues, error: supabaseError } = await supabase
        .from('issues')
        .select('*')
        .in('status', ['en-estudio', 'en-curso']);

      if (supabaseError) {
        console.error('Error al obtener incidencias:', supabaseError);
        throw new Error('No se pudieron obtener las incidencias de la base de datos');
      }

      if (!openIssues || openIssues.length === 0) {
        toast({
          title: "Sin incidencias",
          description: "No hay incidencias abiertas para enviar en el resumen",
        });
        return;
      }

      console.log('Incidencias obtenidas:', openIssues.length);

      // Verificar que hay emails asignados
      const assignedEmails = openIssues
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

      // Obtener URLs de imágenes para las incidencias
      const { data: issueImages, error: imagesError } = await supabase
        .from('issue_images')
        .select('*');

      if (imagesError) {
        console.error('Error al obtener imágenes de incidencias:', imagesError);
      }
      
      // Asociar imágenes con las incidencias
      const imageMap = {};
      if (issueImages && issueImages.length > 0) {
        issueImages.forEach(img => {
          imageMap[img.issue_id] = img.image_url;
        });
      }

      // Preparar estadísticas del dashboard para el email
      const dashboardStats = {
        total: issues?.length || 0,
        inStudy: issues?.filter(issue => issue.status === 'en-estudio').length || 0,
        inProgress: issues?.filter(issue => issue.status === 'en-curso').length || 0,
        closed: issues?.filter(issue => issue.status === 'cerrada').length || 0,
        denied: issues?.filter(issue => issue.status === 'denegado').length || 0,
        byArea: getIssuesByArea(issues || []),
        byStatus: getIssuesByStatus(issues || []),
      };

      // Transformar los datos para que coincidan con el formato esperado por la edge function
      const formattedIssues = openIssues.map(issue => ({
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
        url_key: issue.url_key,
        imageUrl: imageMap[issue.id] // Añadir URL de la imagen si existe
      }));

      console.log('Llamando a la edge function para enviar el email...');
      const functionUrl = 'https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-report-email';
      console.log('URL de la edge function:', functionUrl);
      console.log('Payload de la solicitud:', JSON.stringify({ 
        issues: formattedIssues, 
        dashboardStats 
      }, null, 2));
      
      // Opción 1: Usando supabase.functions.invoke
      try {
        console.log('Intentando enviar con supabase.functions.invoke...');
        const { data, error } = await supabase.functions.invoke('send-report-email', {
          body: { 
            issues: formattedIssues,
            dashboardStats
          }
        });

        if (error) {
          console.error('Error al llamar a la edge function con supabase.functions.invoke:', error);
          // No lanzar error aquí, intentaremos con fetch directo
          
          // Extraer detalles adicionales del error
          console.error('Mensaje de error:', error.message);
          console.error('Código de error:', error.code);
          console.error('Detalles:', error.details);
          
          // Intentar con fetch directo si invoke falla
          throw new Error('Fallback a fetch directo');
        }

        console.log('Respuesta completa de la edge function (invoke):', data);
        handleSuccessResponse(data);
        return;
      } catch (invokeError) {
        console.warn('Error o fallback desde invoke, intentando con fetch directo:', invokeError);
      }
      
      // Opción 2: Usando fetch directo (fallback)
      console.log('Intentando enviar con fetch directo...');
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.session()?.access_token || ''}`,
          'apikey': supabase.supabaseKey,
        },
        body: JSON.stringify({ 
          issues: formattedIssues,
          dashboardStats
        }),
      });

      console.log('Respuesta HTTP del fetch directo:', response.status, response.statusText);
      console.log('Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorText;
        try {
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
          console.error('Error detallado del fetch directo (JSON):', errorJson);
        } catch (e) {
          errorText = await response.text();
          console.error('Error detallado del fetch directo (texto):', errorText);
        }
        throw new Error(`Error en la respuesta HTTP: ${response.status} ${response.statusText}. Detalles: ${errorText}`);
      }

      const data = await response.json();
      console.log('Respuesta completa de la edge function (fetch):', data);
      
      handleSuccessResponse(data);

    } catch (error) {
      console.error('Error detallado:', error);
      
      // Mensaje de error más amigable basado en el tipo de error
      let errorMessage = "No se pudo enviar el resumen de incidencias";
      
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          errorMessage = "Demasiadas solicitudes. Espere un momento e intente de nuevo.";
        } else if (error.message.includes('403')) {
          errorMessage = "No tiene permisos para enviar emails. Verifique la configuración de Resend y los permisos.";
        } else if (error.message.includes('net::ERR') || error.message.includes('Failed to fetch')) {
          errorMessage = "Error de conexión. Verifique su conexión a Internet.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error al enviar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleSuccessResponse = (data: any) => {
    if (!data || !data.success) {
      throw new Error(data?.error || 'Error desconocido al enviar el email');
    }

    // Mostrar mensaje con nota sobre modo de prueba si existe
    let description = data.message || "Email de resumen enviado correctamente";
    if (data.note) {
      description += ` (${data.note})`;
    }
    
    // Añadir información sobre destinatarios originales si está disponible
    if (data.originalRecipients && data.originalRecipients.length > 0) {
      description += `. Destinatarios originales: ${data.originalRecipients.join(', ')}`;
    }

    toast({
      title: "Resumen enviado",
      description: description,
    });
  };

  // Funciones auxiliares para obtener estadísticas
  const getIssuesByArea = (issues: Issue[]) => {
    const result: Record<string, number> = {};
    issues.forEach(issue => {
      const area = issue.area || 'Sin área';
      result[area] = (result[area] || 0) + 1;
    });
    return result;
  };

  const getIssuesByStatus = (issues: Issue[]) => {
    const result: Record<string, number> = {};
    issues.forEach(issue => {
      result[issue.status] = (result[issue.status] || 0) + 1;
    });
    return result;
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
