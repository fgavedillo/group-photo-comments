
import { Button } from "@/components/ui/button";

interface ReportMethodSelectorProps {
  useResend: boolean;
  toggleSendMethod: () => void;
}

export const ReportMethodSelector = ({ 
  useResend, 
  toggleSendMethod 
}: ReportMethodSelectorProps) => {
  return (
    <Button
      variant="ghost" 
      size="sm"
      onClick={toggleSendMethod}
      className="text-xs"
      title={`Actualmente usando: ${useResend ? 'Resend' : 'EmailJS'}`}
    >
      Usar {useResend ? 'EmailJS' : 'Resend'}
    </Button>
  );
};
