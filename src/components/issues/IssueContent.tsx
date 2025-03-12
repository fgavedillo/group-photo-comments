
import { CardContent } from "@/components/ui/card";
import { ImageModal } from "../ImageModal";
import { EmailAssignmentForm } from "../EmailAssignmentForm";
import { Issue } from "@/types/issue";
import { useState } from "react";

interface IssueContentProps {
  message: Issue;
  imageUrl?: string;
  onAssignedEmailChange: (issueId: number, email: string) => void;
}

export const IssueContent = ({ message, imageUrl, onAssignedEmailChange }: IssueContentProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // Validar la URL de la imagen y asegurar que sea una cadena
  let validatedImageUrl: string = "";
  
  if (imageUrl && typeof imageUrl === 'string') {
    try {
      // Verificar si es una URL válida
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        new URL(imageUrl);
        validatedImageUrl = imageUrl;
      }
    } catch (e) {
      console.warn("URL de imagen inválida:", imageUrl);
    }
  }

  return (
    <CardContent>
      {validatedImageUrl && (
        <div className="mb-4">
          <div 
            className="cursor-pointer" 
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={validatedImageUrl}
              alt="Issue"
              className="w-full h-32 object-cover rounded-md"
              onError={(e) => {
                console.warn("Error al cargar la imagen:", validatedImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <ImageModal
            imageUrl={validatedImageUrl}
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
          />
        </div>
      )}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Estado: <span className="font-medium text-foreground">{message.status}</span></p>
        {message.area && <p>Área: <span className="font-medium text-foreground">{message.area}</span></p>}
        {message.responsable && <p>Responsable: <span className="font-medium text-foreground">{message.responsable}</span></p>}
        {message.securityImprovement && (
          <p>Mejora de seguridad: <span className="font-medium text-foreground">{message.securityImprovement}</span></p>
        )}
        {message.actionPlan && (
          <p>Plan de acción: <span className="font-medium text-foreground">{message.actionPlan}</span></p>
        )}
      </div>
      
      <div className="mt-4">
        <EmailAssignmentForm
          assignedEmail={message.assignedEmail || ""}
          onEmailChange={(email) => onAssignedEmailChange(message.id, email)}
          message={message.message}
          imageUrl={validatedImageUrl}
          issue={message} // Pasamos todo el objeto issue para tener acceso a todos sus campos
        />
      </div>
    </CardContent>
  );
};
