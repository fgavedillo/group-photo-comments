
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
  
  // Asegurarse de que la URL de la imagen sea válida
  const isValidImageUrl = imageUrl && typeof imageUrl === 'string' && 
                         (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'));

  return (
    <CardContent>
      {isValidImageUrl && (
        <div className="mb-4">
          <div 
            className="cursor-pointer" 
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={imageUrl}
              alt="Issue"
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
          <ImageModal
            imageUrl={imageUrl}
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
          imageUrl={isValidImageUrl ? imageUrl : undefined}
        />
      </div>
    </CardContent>
  );
};
