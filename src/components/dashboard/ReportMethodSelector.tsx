
// Componente simplificado que ya no ofrece opciones de método de envío
import { Button } from "@/components/ui/button";

// Este componente mantiene la interfaz pero ya no tiene funcionalidad real
interface ReportMethodSelectorProps {
  useResend: boolean;
  toggleSendMethod: () => void;
}

export const ReportMethodSelector = () => {
  return (
    <Button
      variant="ghost" 
      size="sm"
      className="text-xs"
      title="Funcionalidad de envío de correo deshabilitada"
      disabled
    >
      Envío de correos deshabilitado
    </Button>
  );
};
