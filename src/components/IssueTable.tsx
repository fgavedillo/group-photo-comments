import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Issue } from "@/types/issue";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { ImageModal } from "./ImageModal";
import { realtimeManager } from "@/lib/realtimeManager";

interface IssueTableProps {
  issues: Issue[];
  onIssuesUpdate: () => void;
}

export const IssueTable = ({ issues, onIssuesUpdate }: IssueTableProps) => {
  // Estado para controlar la vista de imagen ampliada
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Ref para controlar las actualizaciones
  const isUpdatingRef = useRef(false);
  const pendingUpdateRef = useRef(false);

  // Función para manejar actualizaciones con debounce
  const handleUpdate = () => {
    if (isUpdatingRef.current) {
      // Si estamos actualizando, marcar que hay una actualización pendiente
      pendingUpdateRef.current = true;
      return;
    }

    // Marcar que estamos actualizando
    isUpdatingRef.current = true;
    
    // Actualizar los datos
    console.log('Actualizando tabla de incidencias...');
    onIssuesUpdate();
    
    // Después de un tiempo, permitir nuevas actualizaciones
    setTimeout(() => {
      isUpdatingRef.current = false;
      
      // Si hay actualizaciones pendientes, procesarlas
      if (pendingUpdateRef.current) {
        pendingUpdateRef.current = false;
        handleUpdate();
      }
    }, 300);
  };

  useEffect(() => {
    console.log('Configurando suscripción a cambios en tiempo real para la tabla de incidencias');
    
    // Suscribirse a cambios en tiempo real usando el gestor centralizado
    const cleanupIssues = realtimeManager.subscribe(
      'table-changes',
      { event: '*', table: 'issues' },
      () => handleUpdate()
    );
    
    const cleanupImages = realtimeManager.subscribe(
      'table-changes',
      { event: '*', table: 'issue_images' },
      () => handleUpdate()
    );

    // Limpieza al desmontar
    return () => {
      cleanupIssues();
      cleanupImages();
    };
  }, [onIssuesUpdate]);

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="min-w-[200px]">Que Sucede</TableHead>
            <TableHead className="min-w-[200px]">Plan de Acción</TableHead>
            <TableHead className="min-w-[200px]">Mejora de Seguridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Email Asignado</TableHead>
            <TableHead>Imagen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>{issue.id}</TableCell>
              <TableCell>{format(issue.timestamp, 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell>{issue.username}</TableCell>
              <TableCell className="whitespace-pre-wrap">{issue.message}</TableCell>
              <TableCell className="whitespace-pre-wrap">{issue.actionPlan || '-'}</TableCell>
              <TableCell className="whitespace-pre-wrap">{issue.securityImprovement || '-'}</TableCell>
              <TableCell>{issue.status}</TableCell>
              <TableCell>{issue.area || '-'}</TableCell>
              <TableCell>{issue.responsable || '-'}</TableCell>
              <TableCell>{issue.assignedEmail || '-'}</TableCell>
              <TableCell>
                {issue.imageUrl && (
                  <img 
                    src={issue.imageUrl} 
                    alt="Incidencia" 
                    className="w-20 h-20 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage(issue.imageUrl)}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      console.error('Error loading image:', issue.imageUrl);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Modal para visualizar imágenes */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};
