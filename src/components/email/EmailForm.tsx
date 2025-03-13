
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Issue } from "@/types/issue";

interface EmailFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSendEmail: () => void;
  isLoading: boolean;
  isProcessingImage: boolean;
  error: string | null;
}

export const EmailForm = ({
  email,
  onEmailChange,
  onSendEmail,
  isLoading,
  isProcessingImage,
  error
}: EmailFormProps) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Correo de Notificación</h4>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <Button 
          variant="outline" 
          onClick={onSendEmail}
          className="shrink-0"
          disabled={isLoading || isProcessingImage}
        >
          {isLoading || isProcessingImage ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {isProcessingImage ? 'Procesando...' : 'Enviando...'}
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
