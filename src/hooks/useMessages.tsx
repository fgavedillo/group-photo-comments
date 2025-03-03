
import { useState, useEffect, useCallback } from "react";
import { Message } from "@/types/message";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { decodeQuotedPrintable } from "@/utils/stringUtils";

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

      const formattedMessages = issuesData.map(issue => {
        // Priorizar el nombre que aparece en la gestión (responsable si existe)
        let username = issue.responsable || issue.username;
        
        // Si no hay username ni responsable, intentar construir desde first_name y last_name
        if (!username) {
          const firstName = issue.first_name || '';
          const lastName = issue.last_name || '';
          
          if (firstName || lastName) {
            username = `${firstName} ${lastName}`.trim();
          } else {
            username = 'Usuario';
          }
        }
        
        // Decodificar el mensaje para evitar problemas de codificación
        const decodedMessage = issue.message ? decodeQuotedPrintable(issue.message) : '';
        
        return {
          id: issue.id.toString(),
          username,
          firstName: issue.first_name,
          lastName: issue.last_name,
          timestamp: new Date(issue.timestamp || Date.now()),
          message: decodedMessage,
          imageUrl: issue.image_url || undefined,
          status: issue.status || 'en-estudio',
          area: issue.area || undefined,
          responsable: issue.responsable || undefined,
          securityImprovement: issue.security_improvement || undefined,
          actionPlan: issue.action_plan || undefined,
          assignedEmail: issue.assigned_email || undefined,
          userId: issue.user_id || undefined
        };
      });

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
