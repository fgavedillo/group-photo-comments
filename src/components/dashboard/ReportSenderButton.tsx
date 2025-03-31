
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

// Componente simplificado sin funcionalidad de envío de reportes
export const ReportSenderButton = () => {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={true}
          title="Funcionalidad deshabilitada"
        >
          <FileText className="mr-2 h-4 w-4" />
          Generar Reporte
        </Button>
      </div>
    </div>
  );
};
