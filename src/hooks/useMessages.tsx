
import { useState, useEffect } from "react";
import { Message } from "@/components/MessageList";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const loadMessages = async () => {
    try {
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          *,
          issue_images (
            image_url
          )
        `)
        .order('timestamp', { ascending: true });

      if (issuesError) throw issuesError;

      // Obtener los usuarios para los user_ids
      const userIds = issuesData
        .map(issue => issue.user_id)
        .filter(id => id !== null) as string[];

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const userMap = new Map(
        usersData?.map(user => [user.id, user]) || []
      );

      const formattedMessages = issuesData.map(issue => {
        const user = issue.user_id ? userMap.get(issue.user_id) : null;
        
        return {
          id: issue.id.toString(),
          username: user
            ? `${user.first_name} ${user.last_name}`
            : "Sin nombre", // Cambiado de issue.username a "Sin nombre"
          timestamp: new Date(issue.timestamp),
          message: issue.message,
          imageUrl: issue.issue_images?.[0]?.image_url || undefined,
          status: issue.status,
          area: issue.area,
          responsable: issue.responsable,
          securityImprovement: issue.security_improvement,
          actionPlan: issue.action_plan,
          assignedEmail: issue.assigned_email
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
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  return { messages, loadMessages };
};
