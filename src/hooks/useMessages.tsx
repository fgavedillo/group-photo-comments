
import { useState, useEffect, useCallback } from "react";
import { Message } from "@/types/message";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadMessages = useCallback(async () => {
    try {
      console.log('Iniciando carga de mensajes...');
      setIsLoading(true);
      
      const { data: issuesData, error: issuesError } = await supabase
        .from('issue_details')
        .select('*')
        .order('timestamp', { ascending: false });

      if (issuesError) {
        console.error('Error al cargar mensajes:', issuesError);
        throw issuesError;
      }

      if (!issuesData) {
        console.log('No se encontraron mensajes');
        setMessages([]);
        return;
      }

      console.log('Mensajes cargados:', issuesData);

      const formattedMessages = issuesData.map(issue => ({
        id: issue.id.toString(),
        username: issue.username || 'Usuario',
        timestamp: new Date(issue.timestamp || Date.now()),
        message: issue.message || '',
        imageUrl: issue.image_url || undefined,
        status: issue.status || 'en-estudio',
        area: issue.area || undefined,
        responsable: issue.responsable || undefined,
        securityImprovement: issue.security_improvement || undefined,
        actionPlan: issue.action_plan || undefined,
        assignedEmail: issue.assigned_email || undefined,
        userId: issue.user_id || undefined
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMessages();

    // Configurar suscripción a cambios en tiempo real para todas las tablas relevantes
    const channel = supabase
      .channel('table-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Cambio detectado en issues:', payload);
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_images'
        },
        (payload) => {
          console.log('Cambio detectado en issue_images:', payload);
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  return { messages, loadMessages, isLoading };
};
