
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw, Filter, AlertCircle, CheckCircle, Mail, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReportMethodSelector } from "./ReportMethodSelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ReportSenderButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtered, setFiltered] = useState(false);
  
  const handleSendReport = async () => {
    try {
      console.log("Email functionality has been removed");
      // You would implement your new email sending solution here
    } catch (err) {
      console.error("Error:", err);
    }
  };
  
  const toggleFilter = () => {
    setFiltered(!filtered);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendReport}
          disabled={isLoading}
          className={filtered ? "border-green-600 text-green-700" : ""}
          title={filtered ? "Enviar a cada persona solo sus incidencias asignadas" : "Enviar todas las incidencias a todos los contactos configurados"}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {filtered 
                ? "Enviar Reporte Individual" 
                : "Enviar Reporte Completo"}
            </>
          )}
        </Button>
        
        <Button
          variant="ghost" 
          size="sm"
          onClick={toggleFilter}
          className="text-xs"
          title={filtered ? "Cambiar a modo de envío global" : "Cambiar a modo de envío personalizado"}
        >
          <Filter className={`h-4 w-4 mr-2 ${filtered ? 'text-green-600' : ''}`} />
          {filtered ? "Modo Global" : "Modo Individual"}
        </Button>
        
        <ReportMethodSelector />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <div className="text-xs space-y-2">
                <p><strong>Nota:</strong> La funcionalidad de envío de correos ha sido deshabilitada.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <span>Envío de correos deshabilitado</span>
        </div>
      </div>
      
      {error ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
};
