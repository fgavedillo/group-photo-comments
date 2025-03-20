
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReportSender } from "@/hooks/useReportSender";
import { FileImage, RefreshCw, Filter, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

export const ReportSenderButton = () => {
  const { sendReport, isLoading, error, lastResponse } = useReportSender();
  const [filtered, setFiltered] = useState(false);
  
  const handleSendReport = async () => {
    try {
      await sendReport(filtered);
    } catch (err) {
      // El error ya está manejado en el hook
      console.error("Error manejado en el botón:", err);
    }
  };
  
  const toggleFilter = () => {
    setFiltered(!filtered);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReport}
          disabled={isLoading}
          className={filtered ? "border-green-600 text-green-700" : ""}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <FileImage className="mr-2 h-4 w-4" />
              Enviar Reporte {filtered ? '(Filtrado)' : '(Completo)'}
            </>
          )}
        </Button>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={toggleFilter}
          className="text-xs"
        >
          <Filter className={`h-4 w-4 mr-2 ${filtered ? 'text-green-600' : ''}`} />
          {filtered ? 'Desactivar filtro' : 'Activar filtro'}
        </Button>
      </div>
      
      {(error || lastResponse) && (
        <div className="mt-2">
          {error ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de envío</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : lastResponse?.success ? (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Envío exitoso</AlertTitle>
              <AlertDescription>
                Se envió el reporte a {lastResponse.recipients?.length || 0} destinatario(s) exitosamente.
                {lastResponse.stats && (
                  <div className="text-xs mt-1 text-gray-500">
                    {lastResponse.stats.successCount} envíos exitosos, {lastResponse.stats.failureCount} fallidos.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}
      
      <Alert variant="default" className="bg-blue-50 border-blue-200 text-sm">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm">¿Qué hace este botón?</AlertTitle>
        <AlertDescription className="text-xs">
          <p>
            El botón "Enviar Reporte" genera y envía por correo un resumen de las incidencias pendientes.
          </p>
          <ul className="list-disc pl-5 mt-2 text-xs">
            <li><strong>Reporte Completo:</strong> Envía todas las incidencias a los administradores.</li>
            <li><strong>Reporte Filtrado:</strong> Envía a cada responsable solo sus incidencias asignadas.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
