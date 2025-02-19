
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Issue } from "@/types/issue";

export const useIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { toast } = useToast();

  const loadIssues = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, user must be authenticated');
        return;
      }

      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          *,
          issue_images (
            image_url
          ),
          profiles!user_id (
            first_name,
            last_name
          )
        `)
        .order('timestamp', { ascending: false });

      if (issuesError) {
        console.error('Error fetching issues:', issuesError);
        throw issuesError;
      }

      if (!issuesData) {
        console.log('No issues data returned');
        return;
      }

      console.log('Fetched issues:', issuesData);

      const formattedIssues: Issue[] = issuesData.map(issue => {
        // Si el issue tiene user_id, intentamos obtener el nombre del perfil
        let username = "Sin asignar";
        if (issue.user_id && issue.profiles) {
          const firstName = issue.profiles.first_name || '';
          const lastName = issue.profiles.last_name || '';
          if (firstName || lastName) {
            username = `${firstName} ${lastName}`.trim();
          }
        }

        return {
          id: issue.id,
          imageUrl: issue.issue_images?.[0]?.image_url || '',
          timestamp: new Date(issue.timestamp || ''),
          username,
          message: issue.message,
          securityImprovement: issue.security_improvement || undefined,
          actionPlan: issue.action_plan || undefined,
          status: (issue.status as Issue['status']) || 'en-estudio',
          assignedEmail: issue.assigned_email || undefined,
          area: issue.area || undefined,
          responsable: issue.responsable || undefined
        };
      });

      setIssues(formattedIssues);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las incidencias",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadIssues();

    const channel = supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Received realtime update:', payload);
          loadIssues();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return { issues, loadIssues };
};
