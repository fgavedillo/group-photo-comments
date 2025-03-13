
import { Button } from "@/components/ui/button";
import { FileImage, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useEmailJS } from "@/hooks/useEmailJS";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface ReportButtonProps {
  dashboardRef: React.RefObject<HTMLDivElement>;
  issuesTableRef?: React.RefObject<HTMLDivElement>;
}

export const ReportButton = ({ dashboardRef, issuesTableRef }: ReportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { sendEmail, isLoading } = useEmailJS();
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (isGenerating || isLoading || !dashboardRef.current) return;
    
    try {
      setIsGenerating(true);
      toast({
        title: "Generando reporte",
        description: "Este proceso puede tardar unos segundos...",
      });

      // Capturar el dashboard
      const dashboardCanvas = await html2canvas(dashboardRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      // Convertir a base64
      const dashboardImage = dashboardCanvas.toDataURL("image/png");
      
      // Capturar la tabla de incidencias si está disponible
      let tableImage = "";
      if (issuesTableRef?.current) {
        const tableCanvas = await html2canvas(issuesTableRef.current, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        tableImage = tableCanvas.toDataURL("image/png");
      }

      // Formatear la fecha actual en español para el email
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Preparar los parámetros para EmailJS
      const templateParams = {
        to_name: "Equipo de Seguridad",
        to_email: "", // Se rellenará en el formulario
        from_name: "Sistema de Incidencias",
        date: currentDate,
        message: `Reporte automático generado el ${currentDate}`,
        report_image: dashboardImage,
        table_image: tableImage,
      };

      // Solicitar el email de destino
      const emailTo = window.prompt("Ingrese el correo electrónico de destino:", "");
      if (!emailTo) {
        setIsGenerating(false);
        toast({
          title: "Envío cancelado",
          description: "No se proporcionó un correo electrónico",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el destinatario
      templateParams.to_email = emailTo;

      // Enviar por EmailJS
      await sendEmail(
        {
          serviceId: 'service_yz5opji',
          templateId: 'template_ddq6b3h',
          publicKey: 'RKDqUO9tTPGJrGKLQ',
        },
        templateParams
      );

      toast({
        title: "Reporte enviado",
        description: `Se ha enviado el reporte a ${emailTo} exitosamente`
      });
    } catch (error) {
      console.error("Error al generar/enviar el reporte:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar o enviar el reporte",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateReport}
      disabled={isGenerating || isLoading}
      className="ml-auto"
    >
      {isGenerating || isLoading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileImage className="mr-2 h-4 w-4" />
          Enviar Reporte
        </>
      )}
    </Button>
  );
};
