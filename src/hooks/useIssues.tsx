import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "@/types/issue";

export const useIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { toast } = useToast();

  const loadIssues = async () => {
    try {
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

      const formattedIssues: Issue[] = issuesData.map(issue => ({
        id: issue.id,
        imageUrl: issue.issue_images?.[0]?.image_url || '',
        timestamp: new Date(issue.timestamp || ''),
        username: issue.username,
        message: issue.message,
        securityImprovement: issue.security_improvement || undefined,
        actionPlan: issue.action_plan || undefined,
        status: (issue.status as Issue['status']) || 'en-estudio',
        assignedEmail: issue.assigned_email || undefined,
        area: issue.area || undefined,
        responsable: issue.responsable || undefined
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

  useEffect(() => {
    loadIssues();
  }, []);

  return { issues, loadIssues };
};