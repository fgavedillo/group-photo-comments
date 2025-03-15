
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
      const uniqueEmails = [...new Set(data
        .map(item => item.assigned_email)
        .filter(email => email && typeof email === 'string' && email.trim() !== '' && email.includes('@'))
      )];
      
      console.log('Emails responsables encontrados:', uniqueEmails);
      
      if (uniqueEmails.length === 0) {
        throw new Error('No se encontraron responsables con correos válidos para incidencias pendientes');
      }
      
      return uniqueEmails;
    } catch (error: any) {
      console.error('Error al obtener emails de responsables:', error);
      throw error;
    }
  };

  // Función para redimensionar y optimizar la imagen
  const optimizeImage = async (canvas: HTMLCanvasElement): Promise<string> => {
    // Reducir tamaño y calidad
    const maxSize = 600; // Tamaño máximo en cualquier dimensión
    
    let width = canvas.width;
    let height = canvas.height;
    
    // Redimensionar manteniendo proporción si excede el tamaño máximo
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }
    
    // Crear un nuevo canvas con las dimensiones reducidas
    const resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = width;
    resizeCanvas.height = height;
    
    const ctx = resizeCanvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener contexto 2D');
    
    // Dibujar la imagen redimensionada
    ctx.drawImage(canvas, 0, 0, width, height);
    
    // Convertir a JPEG con calidad reducida (0.5 de 1.0) para reducir aún más el tamaño
    return resizeCanvas.toDataURL('image/jpeg', 0.5);
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
      console.log('Emails válidos para envío:', responsibleEmails);

      // Capturar el dashboard con escala reducida para menor tamaño
      const dashboardCanvas = await html2canvas(dashboardRef.current, {
        scale: 0.5, // Reducir la escala para menor tamaño
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      
      // Optimizar la imagen del dashboard
      const dashboardImage = await optimizeImage(dashboardCanvas);
      console.log(`Tamaño de imagen dashboard: ${Math.round(dashboardImage.length / 1024)}KB`);
      
      // Capturar la tabla de incidencias si está disponible
      let tableImage = "";
      if (issuesTableRef?.current) {
        const tableCanvas = await html2canvas(issuesTableRef.current, {
          scale: 0.4, // Reducir aún más la escala para la tabla
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        tableImage = await optimizeImage(tableCanvas);
        console.log(`Tamaño de imagen tabla: ${Math.round(tableImage.length / 1024)}KB`);
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
          // Re-verificar que el email es válido justo antes de enviar
          if (!email || typeof email !== 'string' || !email.includes('@')) {
            console.error('Email inválido detectado:', email);
            errorCount++;
            continue;
          }

          // Preparar los parámetros para EmailJS
          const templateParams = {
            to_name: "Responsable de Incidencias",
            to_email: email.trim(),
            from_name: "Sistema de Incidencias",
            date: currentDate,
            message: `Reporte automático de incidencias pendientes generado el ${currentDate}`,
            report_image: dashboardImage,
            table_image: tableImage || undefined,
          };

          // Imprimir el tamaño para debugging
          console.log(`Enviando email a ${email}:`);
          console.log(`- Tamaño dashboard: ${Math.round(dashboardImage.length/1024)}KB`);
          console.log(`- Tamaño tabla: ${tableImage ? Math.round(tableImage.length/1024) : 0}KB`);
          
          // Enviar por EmailJS con config específica para reportes
          await sendEmail(
            {
              serviceId: 'service_yz5opji',
              templateId: 'template_ddq6b3h', 
              publicKey: 'RKDqUO9tTPGJrGKLQ',
            },
            templateParams
          );
          
          successCount++;
          console.log(`Email enviado correctamente a ${email}`);
        } catch (error: any) {
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
          description: "No se pudo enviar ningún reporte. Revise la consola para más detalles.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
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
