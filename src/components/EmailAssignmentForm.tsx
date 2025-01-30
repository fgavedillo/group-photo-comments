import { Input } from "@/components/ui/input";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
}

export const EmailAssignmentForm = ({ assignedEmail, onEmailChange }: EmailAssignmentFormProps) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Correo de Notificación</h4>
      <Input
        type="email"
        placeholder="Correo electrónico"
        value={assignedEmail}
        onChange={(e) => onEmailChange(e.target.value)}
      />
    </div>
  );
};