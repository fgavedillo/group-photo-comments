
// Componente simplificado sin opciones de método de envío
import { Button } from "@/components/ui/button";

// Este componente mantiene la interfaz pero sin funcionalidad
export const ReportMethodSelector = () => {
  return (
    <Button
      variant="ghost" 
      size="sm"
      className="text-xs"
      title="Funcionalidad deshabilitada"
      disabled
    >
      Envío deshabilitado
    </Button>
  );
};
