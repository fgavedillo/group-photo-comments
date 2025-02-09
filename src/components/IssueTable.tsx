
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Issue } from "@/types/issue";
import { format } from "date-fns";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface IssueTableProps {
  issues: Issue[];
  onIssuesUpdate: () => void;
}

export const IssueTable = ({ issues, onIssuesUpdate }: IssueTableProps) => {
  useEffect(() => {
    const channel = supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        () => {
          console.log('Issues table changed, refreshing data...');
          onIssuesUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
              <TableCell className="whitespace-pre-wrap">{issue.action_plan || '-'}</TableCell>
              <TableCell className="whitespace-pre-wrap">{issue.security_improvement || '-'}</TableCell>
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
