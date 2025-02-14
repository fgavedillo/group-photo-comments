
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "@/types/issue";

export const useIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { toast } = useToast();

  const loadIssues = async () => {
    try {
      // Primero obtenemos la sesión actual
      const { data: { session } } = await supabase.auth.getSession();

      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          *,
          issue_images (
            image_url
          )
        `)
        .order('timestamp', { ascending: false });

      if (issuesError) throw issuesError;

      if (!issuesData) return;

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

      const formattedIssues: Issue[] = issuesData.map(issue => {
        // Si el issue fue creado por el usuario actual, usamos su información
        if (session && issue.user_id === session.user.id) {
          const currentUser = userMap.get(session.user.id);
          if (currentUser) {
            return {
              id: issue.id,
              imageUrl: issue.issue_images?.[0]?.image_url || '',
              timestamp: new Date(issue.timestamp || ''),
              username: `${currentUser.first_name} ${currentUser.last_name}`,
              message: issue.message,
              securityImprovement: issue.security_improvement || undefined,
              actionPlan: issue.action_plan || undefined,
              status: (issue.status as Issue['status']) || 'en-estudio',
              assignedEmail: issue.assigned_email || undefined,
              area: issue.area || undefined,
              responsable: issue.responsable || undefined
            };
          }
        }

        // Para otros usuarios, buscamos en el userMap
        const user = issue.user_id ? userMap.get(issue.user_id) : null;
        
        return {
          id: issue.id,
          imageUrl: issue.issue_images?.[0]?.image_url || '',
          timestamp: new Date(issue.timestamp || ''),
          username: user
            ? `${user.first_name} ${user.last_name}`
            : "Sin asignar",
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

    // Suscribirse a cambios en la tabla issues
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
          console.log('Issues table changed, refreshing data...');
          loadIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { issues, loadIssues };
};
