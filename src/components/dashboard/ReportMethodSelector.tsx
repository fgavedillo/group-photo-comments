
import { Button } from "@/components/ui/button";

interface ReportMethodSelectorProps {
  alternativeMethod: 'emailjs' | 'edge';
  toggleSendMethod: () => void;
}

export const ReportMethodSelector = ({ 
  alternativeMethod, 
  toggleSendMethod 
}: ReportMethodSelectorProps) => {
  return (
    <Button
      variant="ghost" 
      size="sm"
      onClick={toggleSendMethod}
      className="text-xs"
    >
      Usar {alternativeMethod === 'emailjs' ? 'función Edge' : 'EmailJS'}
    </Button>
  );
};
