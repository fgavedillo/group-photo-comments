
import { useState, useEffect } from "react";
import { Message } from "@/components/MessageList";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface IssueWithProfile {
  id: number;
  message: string;
  timestamp: string;
  status: string;
  area: string | null;
  responsable: string | null;
  security_improvement: string | null;
  action_plan: string | null;
  assigned_email: string | null;
  user_id: string;
  issue_images: { image_url: string }[] | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  };
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const loadMessages = async () => {
    try {
      console.log('Iniciando carga de mensajes...');
      
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          id,
          message,
          timestamp,
          status,
          area,
          responsable,
          security_improvement,
          action_plan,
          assigned_email,
          user_id,
          issue_images (
            image_url
          ),
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .order('timestamp', { ascending: true });

      if (issuesError) {
        console.error('Error al cargar mensajes:', issuesError);
        throw issuesError;
      }

      if (!issuesData) {
        console.log('No se encontraron mensajes');
        return;
      }

      console.log('Mensajes cargados:', issuesData);

      const formattedMessages = (issuesData as IssueWithProfile[]).map(issue => ({
        id: issue.id.toString(),
        username: `${issue.profiles.first_name || ''} ${issue.profiles.last_name || ''}`.trim() || 'Usuario',
        timestamp: new Date(issue.timestamp),
        message: issue.message,
        imageUrl: issue.issue_images?.[0]?.image_url || undefined,
        status: issue.status,
        area: issue.area,
        responsable: issue.responsable,
        securityImprovement: issue.security_improvement,
        actionPlan: issue.action_plan,
        assignedEmail: issue.assigned_email
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        () => {
          console.log('Cambios detectados en la tabla issues, recargando...');
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { messages, loadMessages };
};
