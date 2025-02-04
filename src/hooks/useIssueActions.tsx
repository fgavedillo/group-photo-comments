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
      const { data, error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId)
        .select();

      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }

      console.log('Status updated successfully:', data);
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
    console.log('Updating security improvement:', { issueId, value });
    setSecurityImprovements(prev => ({
      ...prev,
      [issueId]: value
    }));
  };

  const handleActionPlanChange = (issueId: number, value: string) => {
    console.log('Updating action plan:', { issueId, value });
    setActionPlans(prev => ({
      ...prev,
      [issueId]: value
    }));
  };

  const handleAddSecurityImprovement = async (issueId: number) => {
    try {
      console.log('Adding security improvement:', { 
        issueId, 
        security_improvement: securityImprovements[issueId],
        action_plan: actionPlans[issueId]
      });

      const { data, error } = await supabase
        .from('issues')
        .update({
          security_improvement: securityImprovements[issueId] || '',
          action_plan: actionPlans[issueId] || '',
          status: "en-curso"
        })
        .eq('id', issueId)
        .select();

      if (error) {
        console.error('Error adding security improvement:', error);
        throw error;
      }

      console.log('Security improvement added successfully:', data);
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
        console.log('Updating area:', { issueId, area });
        const { data, error } = await supabase
          .from('issues')
          .update({ area })
          .eq('id', issueId)
          .select();

        if (error) {
          console.error('Error updating area:', error);
          throw error;
        }

        console.log('Area updated successfully:', data);
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
        console.log('Updating responsable:', { issueId, responsable });
        const { data, error } = await supabase
          .from('issues')
          .update({ responsable })
          .eq('id', issueId)
          .select();

        if (error) {
          console.error('Error updating responsable:', error);
          throw error;
        }

        console.log('Responsable updated successfully:', data);
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
        console.log('Updating assigned email:', { issueId, email });
        const { data, error } = await supabase
          .from('issues')
          .update({ assigned_email: email })
          .eq('id', issueId)
          .select();

        if (error) {
          console.error('Error updating assigned email:', error);
          throw error;
        }

        console.log('Assigned email updated successfully:', data);
        await loadIssues();
      } catch (error) {
        console.error('Error updating assigned email:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el correo asignado",
          variant: "destructive"
        });
      }
    }
  };
};