import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { Issue } from "@/types/issue";
import { IssueCard } from "./IssueCard";
import { EmailAssignmentForm } from "./EmailAssignmentForm";
import { SecurityImprovementForm } from "./SecurityImprovementForm";

export const IssueManagement = ({ messages }: { messages: any[] }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [securityImprovements, setSecurityImprovements] = useState<{[key: string]: string}>({});
  const [actionPlans, setActionPlans] = useState<{[key: string]: string}>({});
  const [assignedEmail, setAssignedEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadIssues();
  }, []);

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

      const formattedIssues = issuesData.map(issue => ({
        id: issue.id,
        imageUrl: issue.issue_images?.[0]?.image_url || '',
        timestamp: new Date(issue.timestamp || ''),
        username: issue.username,
        description: issue.message,
        securityImprovement: issue.security_improvement || undefined,
        actionPlan: issue.action_plan || undefined,
        status: (issue.status as Issue['status']) || 'en-estudio',
        assignedEmail: issue.assigned_email || undefined
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

  const handleStatusChange = async (issueId: number, status: Issue['status']) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status })
        .eq('id', issueId);

      if (error) throw error;

      const issue = messages.find(m => m.id === issueId);
      if (issue) {
        await handleEmailSend(issueId, status);
      }

      await loadIssues();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
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

      const issueToAssign = messages.find(m => m.id === issueId);
      if (issueToAssign) {
        await sendNotificationEmail(issueToAssign, "en-estudio");
      }

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

  const convertBlobToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix to get just the base64 content
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
                ${securityImprovement ? `<p><strong>Situación a mejorar en seguridad:</strong> ${securityImprovement}</p>` : ''}
                ${actionPlan ? `<p><strong>Plan de acción propuesto:</strong> ${actionPlan}</p>` : ''}
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
      
      // Si hay una imagen, enviar un segundo correo con la imagen adjunta
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

  const handleEmailSend = async (issueId: number, status: Issue['status']) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, status };
      }
      return issue;
    }));

    const issue = messages.find(m => m.id === issueId);
    if (issue) {
      const emailSent = await sendNotificationEmail(issue, status);
      if (!emailSent) {
        toast({
          title: "Error",
          description: "No se pudo enviar el correo de notificación",
          variant: "destructive"
        });
        return;
      }
    }

    toast({
      title: "Estado actualizado",
      description: `La incidencia ha sido marcada como ${status}`
    });
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

      const issue = messages.find(m => m.id === issueId);
      if (issue) {
        await sendNotificationEmail(issue, "en-curso");
      }

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

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {messages.filter(m => m.imageUrl).map((message, index) => (
          <IssueCard
            key={message.id}
            message={message}
            index={index}
            onStatusChange={handleStatusChange}
          >
            <EmailAssignmentForm
              assignedEmail={assignedEmail}
              onEmailChange={setAssignedEmail}
              onAssign={() => handleAssignEmail(message.id)}
            />
            
            <SecurityImprovementForm
              securityImprovement={securityImprovements[message.id] || ''}
              actionPlan={actionPlans[message.id] || ''}
              onSecurityImprovementChange={(value) => handleSecurityImprovementChange(message.id, value)}
              onActionPlanChange={(value) => handleActionPlanChange(message.id, value)}
              onSave={() => handleAddSecurityImprovement(message.id)}
            />
          </IssueCard>
        ))}
      </div>
    </div>
  );
};
