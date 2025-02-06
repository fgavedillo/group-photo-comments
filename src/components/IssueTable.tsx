import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Issue } from "@/types/issue";
import { format } from "date-fns";

interface IssueTableProps {
  issues: Issue[];
}

export const IssueTable = ({ issues }: IssueTableProps) => {
  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Mensaje</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Email Asignado</TableHead>
            <TableHead>Mejora de Seguridad</TableHead>
            <TableHead>Plan de Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>{issue.id}</TableCell>
              <TableCell>{format(issue.timestamp, 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell>{issue.username}</TableCell>
              <TableCell>{issue.message}</TableCell>
              <TableCell>{issue.status}</TableCell>
              <TableCell>{issue.area || '-'}</TableCell>
              <TableCell>{issue.responsable || '-'}</TableCell>
              <TableCell>{issue.assignedEmail || '-'}</TableCell>
              <TableCell>{issue.securityImprovement || '-'}</TableCell>
              <TableCell>{issue.actionPlan || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};