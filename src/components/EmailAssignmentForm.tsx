
import { Issue } from "@/types/issue";
import { EmailForm } from "./email/EmailForm";
import { useIssueEmail } from "@/hooks/useIssueEmail";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  message: string;
  imageUrl?: string;
  issue?: Issue;
}

export const EmailAssignmentForm = ({ 
  assignedEmail, 
  onEmailChange, 
  message, 
  imageUrl,
  issue 
}: EmailAssignmentFormProps) => {
  const {
    email,
    setEmail,
    isLoading,
    isProcessingImage,
    emailError,
    handleSendEmail
  } = useIssueEmail(assignedEmail, message, imageUrl, issue);

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    onEmailChange(newEmail);
  };

  return (
    <EmailForm
      email={email}
      onEmailChange={handleEmailChange}
      onSendEmail={handleSendEmail}
      isLoading={isLoading}
      isProcessingImage={isProcessingImage}
      error={emailError}
    />
  );
};
