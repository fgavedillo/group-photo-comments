import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "@/types/issue";

export const useIssueActions = (loadIssues: () => Promise<void>) => {
  const [securityImprovements, setSecurityImprovements] = useState<{[key: string]: string}>({});
  const [actionPlans, setActionPlans] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  const handleStatusChange = async (issueId: number, status: Issue['status']) => {
    try {
      console.log('Updating status:', { issueId, status });
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId);

      if (error) throw error;

      await loadIssues();
      
      toast({
        title: "Estado actualizado",
        description: `La incidencia ha sido marcada como ${status}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const handleSecurityImprovementChange = (issueId: number, value: string) => {
    setSecurityImprovements(prev => ({
      ...prev,
      [issueId]: value
    }));
  };

  const handleActionPlanChange = (issueId: number, value: string) => {
    setActionPlans(prev => ({
      ...prev,
      [issueId]: value
    }));
  };

  const handleAddSecurityImprovement = async (issueId: number) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({
          security_improvement: securityImprovements[issueId] || '',
          action_plan: actionPlans[issueId] || '',
          status: "en-curso"
        })
        .eq('id', issueId);

      if (error) throw error;

      await loadIssues();
      
      toast({
        title: "Situación actualizada",
        description: "Se han guardado los cambios correctamente."
      });
    } catch (error) {
      console.error('Error adding security improvement:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    }
  };

  return {
    securityImprovements,
    actionPlans,
    handleStatusChange,
    handleAreaChange: async (issueId: number, area: string) => {
      try {
        const { error } = await supabase
          .from('issues')
          .update({ area })
          .eq('id', issueId);

        if (error) throw error;
        await loadIssues();
      } catch (error) {
        console.error('Error updating area:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el área",
          variant: "destructive"
        });
      }
    },
    handleResponsableChange: async (issueId: number, responsable: string) => {
      try {
        const { error } = await supabase
          .from('issues')
          .update({ responsable })
          .eq('id', issueId);

        if (error) throw error;
        await loadIssues();
      } catch (error) {
        console.error('Error updating responsable:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el responsable",
          variant: "destructive"
        });
      }
    },
    handleSecurityImprovementChange,
    handleActionPlanChange,
    handleAddSecurityImprovement,
    handleAssignedEmailChange: async (issueId: number, email: string) => {
      try {
        const { error } = await supabase
          .from('issues')
          .update({ assigned_email: email })
          .eq('id', issueId);

        if (error) throw error;
        await loadIssues();
      } catch (error) {
        console.error('Error updating email:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el correo",
          variant: "destructive"
        });
      }
    }
  };
};
