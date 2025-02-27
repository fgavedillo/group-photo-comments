
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Issue } from "@/types/issue";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface IssueTableProps {
  issues: Issue[];
  onIssuesUpdate: () => void;
}

export const IssueTable = ({ issues, onIssuesUpdate }: IssueTableProps) => {
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
    
    // Canal principal para escuchar cambios en la tabla issues
    const issuesChannel = supabase
      .channel('table-issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          console.log('Cambio detectado en issues (tabla):', payload);
          handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción a issues (tabla):', status);
      });
      
    // Canal adicional para escuchar cambios en la tabla issue_images
    const imagesChannel = supabase
      .channel('table-issue-images-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issue_images'
        },
        (payload) => {
          console.log('Cambio detectado en issue_images (tabla):', payload);
          handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Estado de la suscripción a issue_images (tabla):', status);
      });

    // Limpieza al desmontar
    return () => {
      supabase.removeChannel(issuesChannel);
      supabase.removeChannel(imagesChannel);
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
                    className="w-16 h-16 object-cover rounded-md"
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
