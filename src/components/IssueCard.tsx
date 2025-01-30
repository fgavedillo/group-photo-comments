import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Issue } from "@/types/issue";

interface IssueCardProps {
  message: any;
  index: number;
  onStatusChange: (issueId: number, status: Issue['status']) => void;
  children: React.ReactNode;
}

export const IssueCard = ({ message, index, onStatusChange, children }: IssueCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Incidencia #{index + 1}</CardTitle>
        <CardDescription>
          Reportada por {message.username} el {message.timestamp.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <img 
          src={message.imageUrl} 
          alt="Incidencia"
          className="w-full h-48 object-cover rounded-md"
        />
        <p className="text-sm text-muted-foreground">{message.message}</p>
        
        <div className="space-y-2">
          <h4 className="font-medium">Estado de la Incidencia</h4>
          <Select onValueChange={(value) => onStatusChange(message.id, value as Issue['status'])}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-estudio">En Estudio</SelectItem>
              <SelectItem value="en-curso">En Curso</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {children}
      </CardContent>
    </Card>
  );
};