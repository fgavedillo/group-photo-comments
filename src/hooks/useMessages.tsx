
/**
 * Hook personalizado para gestionar la carga y actualización de mensajes/incidencias
 * Proporciona acceso a los mensajes desde la base de datos y suscripción a actualizaciones en tiempo real
 */
import { useState, useEffect, useCallback } from "react";
import { Message } from "@/types/message";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { decodeQuotedPrintable } from "@/utils/stringUtils";
import { realtimeManager } from "@/lib/realtimeManager";

/**
 * Hook para gestionar la carga de mensajes desde la base de datos
 * @returns Objeto con los mensajes, función para recargarlos y estado de carga
 */
export const useMessages = () => {
  // Estado para almacenar los mensajes
  const [messages, setMessages] = useState<Message[]>([]);
  // Estado para indicar si los mensajes están cargando
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  /**
   * Carga los mensajes desde la vista issue_details en la base de datos
   * y los formatea para su uso en la aplicación
   */
  const loadMessages = useCallback(async () => {
    try {
      console.log('Iniciando carga de mensajes...');
      setIsLoading(true);
      
      // Consulta a la vista issue_details que combina datos de varias tablas
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

      console.log('Mensajes cargados:', issuesData.length);

      // Transformar los datos de la base de datos al formato de Message
      const formattedMessages = issuesData.map(issue => {
        // Siempre priorizar el responsable como nombre principal si existe
        let username = issue.responsable || '';
        
        // Si no hay responsable, intentar usar el username
        if (!username) {
          username = issue.username || '';
        }
        
        // Si aún no hay nombre, intentar construirlo desde first_name y last_name
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
        
        // Construir y retornar el objeto Message con todos los datos necesarios
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

      // Actualizar el estado con los mensajes formateados
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
    // Cargar mensajes inicialmente
    loadMessages();

    // Suscribirse a cambios en tiempo real usando el gestor centralizado
    const cleanupIssues = realtimeManager.subscribe(
      'messages-changes',
      { event: '*', table: 'issues' },
      () => loadMessages()
    );
    
    const cleanupImages = realtimeManager.subscribe(
      'messages-changes',
      { event: '*', table: 'issue_images' },
      () => loadMessages()
    );
    
    const cleanupProfiles = realtimeManager.subscribe(
      'messages-changes',
      { event: '*', table: 'profiles' },
      () => loadMessages()
    );

    // Limpiar suscripciones cuando el componente se desmonte
    return () => {
      cleanupIssues();
      cleanupImages();
      cleanupProfiles();
    };
  }, [loadMessages]);

  return { messages, loadMessages, isLoading };
};
