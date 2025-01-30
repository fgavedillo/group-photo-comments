import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailAssignmentFormProps {
  assignedEmail: string;
  onEmailChange: (email: string) => void;
  onAssign: () => void;
}

export const EmailAssignmentForm = ({ assignedEmail, onEmailChange, onAssign }: EmailAssignmentFormProps) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Enviar Notificación</h4>
      <div className="flex space-x-2">
        <Input
          type="email"
          placeholder="Correo electrónico"
          value={assignedEmail}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <Button onClick={onAssign}>
          Enviar Correo
        </Button>
      </div>
    </div>
  );
};