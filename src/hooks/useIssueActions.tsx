import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/supabase";
import { Issue } from "@/types/issue";

export const useIssueActions = (loadIssues: () => Promise<void>) => {
  const [securityImprovements, setSecurityImprovements] = useState<{[key: string]: string}>({});
  const [actionPlans, setActionPlans] = useState<{[key: string]: string}>({});
  const [assignedEmail, setAssignedEmail] = useState("");
  const { toast } = useToast();

  const convertBlobToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Content = base64String.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting blob to base64:', error);
      return '';
    }
  };

  const sendNotificationEmail = async (issueDetails: any, status: Issue['status']) => {
    try {
      let imageBase64 = '';
      if (issueDetails.imageUrl) {
        imageBase64 = await convertBlobToBase64(issueDetails.imageUrl);
      }
      
      const subject = `Nueva acción de seguridad asignada - Incidencia #${issueDetails.id}`;
      const content = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Se te ha asignado una nueva acción de seguridad</h2>
            
            <div style="margin: 20px 0;">
              <p>Hola,</p>
              <p>Se te ha asignado una nueva acción de seguridad para revisar y gestionar. A continuación encontrarás los detalles:</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Estado actual:</strong> ${status}</p>
                <p><strong>Descripción de la situación:</strong> ${issueDetails.message}</p>
                ${securityImprovements[issueDetails.id] ? `<p><strong>Situación a mejorar en seguridad:</strong> ${securityImprovements[issueDetails.id]}</p>` : ''}
                ${actionPlans[issueDetails.id] ? `<p><strong>Plan de acción propuesto:</strong> ${actionPlans[issueDetails.id]}</p>` : ''}
              </div>
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p><strong>Reportado por:</strong> ${issueDetails.username}</p>
              <p><strong>Fecha:</strong> ${issueDetails.timestamp.toLocaleDateString()}</p>
              <p style="color: #666; margin-top: 20px;">Por favor, revisa esta situación y toma las acciones necesarias.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResult = await sendEmail(assignedEmail || "fgavedillo@gmail.com", subject, content);
      
      if (imageBase64) {
        const imageContent = `
          <!DOCTYPE html>
          <html>
          <body>
            <p>Imagen adjunta de la incidencia #${issueDetails.id}</p>
          </body>
          </html>
        `;
        
        await sendEmail(
          assignedEmail || "fgavedillo@gmail.com",
          `Imagen de la incidencia #${issueDetails.id}`,
          imageContent,
          [{
            filename: `incidencia-${issueDetails.id}.jpg`,
            content: imageBase64,
            encoding: 'base64',
            type: 'image/jpeg'
          }]
        );
      }

      return true;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return false;
    }
  };

  const handleStatusChange = async (issueId: number, status: Issue['status']) => {
    try {
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

  const handleAreaChange = async (issueId: number, area: string) => {
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
  };

  const handleResponsableChange = async (issueId: number, responsable: string) => {
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
  };

  const handleAssignEmail = async (issueId: number) => {
    if (!assignedEmail.includes('@')) {
      toast({
        title: "Error",
        description: "Por favor, introduce un correo electrónico válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('issues')
        .update({ assigned_email: assignedEmail })
        .eq('id', issueId);

      if (error) throw error;

      await loadIssues();
      setAssignedEmail("");
      
      toast({
        title: "Correo enviado",
        description: `Se ha enviado la notificación a ${assignedEmail}`
      });
    } catch (error) {
      console.error('Error assigning email:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el correo electrónico",
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
    assignedEmail,
    setAssignedEmail,
    handleStatusChange,
    handleAreaChange,
    handleResponsableChange,
    handleAssignEmail,
    handleSecurityImprovementChange,
    handleActionPlanChange,
    handleAddSecurityImprovement,
    sendNotificationEmail
  };
};