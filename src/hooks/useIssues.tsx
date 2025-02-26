
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Issue } from "@/types/issue";

export const useIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { toast } = useToast();

  const formatUserName = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "Sin asignar";
    return `${firstName || ''} ${lastName || ''}`.trim();
  };

  const loadIssues = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, user must be authenticated');
        return;
      }

      console.log('Fetching issues from issue_details view...');
      const { data: issuesData, error: issuesError } = await supabase
        .from('issue_details')
        .select('*')
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

      const formattedIssues: Issue[] = issuesData.map(issue => ({
        id: issue.id,
        imageUrl: issue.image_url || '',
        timestamp: new Date(issue.timestamp || ''),
        username: formatUserName(issue.first_name, issue.last_name),
        message: issue.message,
        securityImprovement: issue.security_improvement || undefined,
        actionPlan: issue.action_plan || undefined,
        status: (issue.status as Issue['status']) || 'en-estudio',
        assignedEmail: issue.assigned_email || undefined,
        area: issue.area || undefined,
        responsable: issue.responsable || undefined,
        user_id: issue.user_id
      }));

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

  // Suscripción a cambios en tiempo real
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
          // Recargar inmediatamente cuando hay cambios
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
