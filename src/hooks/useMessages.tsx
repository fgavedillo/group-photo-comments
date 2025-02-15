
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
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order('timestamp', { ascending: true });

      if (issuesError) throw issuesError;

      const formattedMessages = issuesData.map(issue => ({
        id: issue.id.toString(),
        username: issue.profiles
          ? `${issue.profiles.first_name} ${issue.profiles.last_name}`
          : "Sin asignar",
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
  }, []);

  return { messages, loadMessages };
};
