
import { Button } from "@/components/ui/button";
import { FileImage, RefreshCw } from "lucide-react";

interface ReportGenerateButtonProps {
  isGenerating: boolean;
  isLoading: boolean;
  handleGenerateReport: () => void;
  alternativeMethod: 'emailjs' | 'edge';
}

export const ReportGenerateButton = ({
  isGenerating,
  isLoading,
  handleGenerateReport,
  alternativeMethod
}: ReportGenerateButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateReport}
      disabled={isGenerating || isLoading}
      className={alternativeMethod === 'edge' ? "border-green-600 text-green-700" : ""}
    >
      {isGenerating || isLoading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileImage className="mr-2 h-4 w-4" />
          Enviar Reporte {alternativeMethod === 'edge' ? '(Edge)' : '(EmailJS)'}
        </>
      )}
    </Button>
  );
};
