import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendEmail } from "@/lib/supabase";
import { ImageCropper } from "./ImageCropper";

interface Issue {
  id: number;
  imageUrl: string;
  timestamp: Date;
  username: string;
  description: string;
  securityImprovement?: string;
  actionPlan?: string;
  status: "en-estudio" | "en-curso" | "cerrada";
  assignedEmail?: string;
}

export const IssueManagement = ({ messages }: { messages: any[] }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [securityImprovement, setSecurityImprovement] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [currentIssueId, setCurrentIssueId] = useState<number | null>(null);
  const { toast } = useToast();

  const convertBlobToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      console.log("Starting blob to base64 conversion for URL:", blobUrl);
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      console.log("Blob type:", blob.type);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          console.log("Base64 string length:", base64String.length);
          resolve(base64String);
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting blob to base64:', error);
      return '';
    }
  };

  const sendNotificationEmail = async (issueDetails: any, status: Issue['status'], croppedImageUrl?: string) => {
    try {
      console.log("Attempting to send notification email:", { issueDetails, status });
      
      let imageDataUrl = '';
      if (croppedImageUrl) {
        imageDataUrl = croppedImageUrl;
        console.log("Using cropped image, length:", imageDataUrl.length);
      } else if (issueDetails.imageUrl) {
        imageDataUrl = await convertBlobToBase64(issueDetails.imageUrl);
        console.log("Converted original image to base64, length:", imageDataUrl.length);
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

            ${imageDataUrl ? `
              <div style="margin: 20px 0;">
                <p><strong>Imagen de referencia:</strong></p>
                <img src="${imageDataUrl}" 
                     alt="Imagen de la situación" 
                     style="display: block; max-width: 500px; width: 100%; height: auto; margin: 0 auto;"
                />
              </div>
            ` : ''}

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p><strong>Reportado por:</strong> ${issueDetails.username}</p>
              <p><strong>Fecha:</strong> ${issueDetails.timestamp.toLocaleDateString()}</p>
              <p style="color: #666; margin-top: 20px;">Por favor, revisa esta situación y toma las acciones necesarias.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log("Sending email with content length:", content.length);
      const emailResult = await sendEmail(assignedEmail || "fgavedillo@gmail.com", subject, content);
      console.log("Email sending result:", emailResult);
      return true;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return false;
    }
  };

  const handleStatusChange = async (issueId: number, status: Issue['status']) => {
    setCurrentIssueId(issueId);
    const issue = messages.find(m => m.id === issueId);
    if (issue?.imageUrl) {
      setCurrentImageUrl(issue.imageUrl);
      setShowCropper(true);
    } else {
      await handleEmailSend(issueId, status);
    }
  };

  const handleEmailSend = async (issueId: number, status: Issue['status'], croppedImage?: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, status };
      }
      return issue;
    }));

    const issue = messages.find(m => m.id === issueId);
    if (issue) {
      const emailSent = await sendNotificationEmail(issue, status, croppedImage);
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

  const handleCropComplete = async (croppedImage: string) => {
    if (currentIssueId === null) return;
    
    const issue = messages.find(m => m.id === currentIssueId);
    if (!issue) return;

    setShowCropper(false);
    await handleEmailSend(currentIssueId, "en-estudio", croppedImage);
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

    const issueToAssign = messages.find(m => m.id === issueId);
    if (issueToAssign) {
      const emailSent = await sendNotificationEmail(issueToAssign, "en-estudio");
      if (!emailSent) {
        toast({
          title: "Error",
          description: "No se pudo enviar el correo de notificación",
          variant: "destructive"
        });
        return;
      }
    }

    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, assignedEmail };
      }
      return issue;
    }));
    
    toast({
      title: "Correo enviado",
      description: `Se ha enviado la notificación a ${assignedEmail}`
    });
    setAssignedEmail("");
  };

  const handleAddSecurityImprovement = async (issueId: number) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, securityImprovement, status: "en-curso" };
      }
      return issue;
    }));

    const issue = messages.find(m => m.id === issueId);
    if (issue) {
      const emailSent = await sendNotificationEmail(issue, "en-curso");
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
      title: "Situación actualizada",
      description: "Se ha guardado la situación a mejorar correctamente."
    });
  };

  return (
    <div className="p-4 space-y-4">
      {showCropper && (
        <ImageCropper
          imageUrl={currentImageUrl}
          onCrop={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {messages.filter(m => m.imageUrl).map((message, index) => (
          <Card key={message.id} className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Incidencia #{index + 1}</CardTitle>
              <CardDescription>
                Reportada por {message.username} el {message.timestamp.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={message.imageUrl} 
                alt="Incidencia"
                className="w-full h-48 object-cover rounded-md"
              />
              <p className="text-sm text-muted-foreground">{message.message}</p>
              
              <div className="space-y-2">
                <h4 className="font-medium">Estado de la Incidencia</h4>
                <Select onValueChange={(value) => handleStatusChange(message.id, value as Issue['status'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-estudio">En Estudio</SelectItem>
                    <SelectItem value="en-curso">En Curso</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Enviar Notificación</h4>
                <div className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder="Correo electrónico"
                    value={assignedEmail}
                    onChange={(e) => setAssignedEmail(e.target.value)}
                  />
                  <Button onClick={() => handleAssignEmail(message.id)}>
                    Enviar Correo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Situación a Mejorar en Seguridad</h4>
                  <Textarea
                    placeholder="Describe la situación a mejorar..."
                    value={securityImprovement}
                    onChange={(e) => setSecurityImprovement(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleAddSecurityImprovement(message.id)}
                    className="w-full"
                  >
                    Guardar Situación
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Plan de Acción</h4>
                  <Textarea
                    placeholder="Describe el plan de acción..."
                    value={actionPlan}
                    onChange={(e) => setActionPlan(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleAddSecurityImprovement(message.id)}
                    className="w-full"
                  >
                    Guardar Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
