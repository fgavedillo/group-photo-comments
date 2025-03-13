
import { Button } from "@/components/ui/button";
import { FileImage, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useEmailJS } from "@/hooks/useEmailJS";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";

interface ReportButtonProps {
  dashboardRef: React.RefObject<HTMLDivElement>;
  issuesTableRef?: React.RefObject<HTMLDivElement>;
}

export const ReportButton = ({ dashboardRef, issuesTableRef }: ReportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { sendEmail, isLoading } = useEmailJS();
  const { toast } = useToast();

  // Función para obtener todos los emails de responsables con incidencias en estudio o en curso
  const getResponsibleEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('assigned_email')
        .in('status', ['en-estudio', 'en-curso'])
        .not('assigned_email', 'is', null);
      
      if (error) throw error;
      
      // Extraer los emails únicos (eliminar duplicados)
      const uniqueEmails = [...new Set(data.map(item => item.assigned_email).filter(Boolean))];
      
      if (uniqueEmails.length === 0) {
        throw new Error('No hay destinatarios con incidencias en estudio o en curso');
      }
      
      return uniqueEmails;
    } catch (error) {
      console.error('Error al obtener emails de responsables:', error);
      throw error;
    }
  };

  // Función para redimensionar la imagen manteniendo la proporción
  const resizeImage = (dataUrl: string, maxWidth: number = 600, maxHeight: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular las nuevas dimensiones manteniendo la proporción
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Reducir calidad para disminuir el tamaño
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.src = dataUrl;
    });
  };

  const handleGenerateReport = async () => {
    if (isGenerating || isLoading || !dashboardRef.current) return;
    
    try {
      setIsGenerating(true);
      toast({
        title: "Generando reporte",
        description: "Este proceso puede tardar unos segundos...",
      });

      // Obtener los emails de los responsables
      const responsibleEmails = await getResponsibleEmails();
      console.log('Enviando reporte a:', responsibleEmails);

      // Capturar el dashboard
      const dashboardCanvas = await html2canvas(dashboardRef.current, {
        scale: 0.7, // Reducir la escala para disminuir el tamaño
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      // Convertir a base64 y redimensionar para reducir el tamaño
      let dashboardImage = dashboardCanvas.toDataURL("image/jpeg", 0.7);
      dashboardImage = await resizeImage(dashboardImage);
      
      // Capturar la tabla de incidencias si está disponible
      let tableImage = "";
      if (issuesTableRef?.current) {
        const tableCanvas = await html2canvas(issuesTableRef.current, {
          scale: 0.7, // Reducir la escala para disminuir el tamaño
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        tableImage = tableCanvas.toDataURL("image/jpeg", 0.7);
        tableImage = await resizeImage(tableImage);
      }

      // Formatear la fecha actual en español para el email
      const currentDate = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Enviar a cada responsable
      let successCount = 0;
      let errorCount = 0;

      for (const email of responsibleEmails) {
        try {
          // Preparar los parámetros para EmailJS
          const templateParams = {
            to_name: "Responsable de Incidencias",
            to_email: email,
            from_name: "Sistema de Incidencias",
            date: currentDate,
            message: `Reporte automático de incidencias pendientes generado el ${currentDate}`,
            report_image: dashboardImage,
            table_image: tableImage,
          };

          // Enviar por EmailJS
          await sendEmail(
            {
              serviceId: 'service_yz5opji',
              templateId: 'template_ddq6b3h',
              publicKey: 'RKDqUO9tTPGJrGKLQ',
            },
            templateParams
          );
          
          successCount++;
        } catch (error) {
          console.error(`Error al enviar a ${email}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Reporte enviado",
          description: `Se ha enviado el reporte a ${successCount} destinatario(s) exitosamente${errorCount > 0 ? `. ${errorCount} envíos fallaron.` : ''}`
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar ningún reporte",
          variant: "destructive"
        });
      }
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
