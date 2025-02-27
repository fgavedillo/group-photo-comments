
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ReportsManagement = () => {
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*')
        .in('status', ['en-estudio', 'en-curso'])
        .order('timestamp', { ascending: false });

      if (error) throw error;

      console.log("Invocando función send-test-report...");
      
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('send-test-report', {
        method: 'POST',
        body: { issues },
      });

      if (functionError) {
        console.error("Error en la función edge:", functionError);
        throw functionError;
      }

      console.log("Respuesta de la función:", functionResponse);

      toast({
        title: "Reporte generado",
        description: "El reporte ha sido enviado a tu correo electrónico",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Gestión de Reportes</h2>
        <Button onClick={handleGenerateReport} className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Generar Resumen Visual
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-600">
          Utiliza el botón "Generar Resumen Visual" para obtener un reporte detallado de todas las incidencias activas
          (en estudio y en curso). El reporte será enviado a tu correo electrónico en un formato visual similar a Excel.
        </p>
      </div>
    </div>
  );
};
