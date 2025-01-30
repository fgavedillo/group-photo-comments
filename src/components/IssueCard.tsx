import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Issue } from "@/types/issue";

interface IssueCardProps {
  message: any;
  index: number;
  onStatusChange: (issueId: number, status: Issue['status']) => void;
  onAreaChange: (issueId: number, area: string) => void;
  onResponsableChange: (issueId: number, responsable: string) => void;
  children: React.ReactNode;
}

export const IssueCard = ({ 
  message, 
  index, 
  onStatusChange, 
  onAreaChange,
  onResponsableChange,
  children 
}: IssueCardProps) => {
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`area-${message.id}`}>Área</Label>
            <Input
              id={`area-${message.id}`}
              placeholder="Área responsable"
              value={message.area || ''}
              onChange={(e) => onAreaChange(message.id, e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`responsable-${message.id}`}>Responsable</Label>
            <Input
              id={`responsable-${message.id}`}
              placeholder="Persona responsable"
              value={message.responsable || ''}
              onChange={(e) => onResponsableChange(message.id, e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Estado de la Incidencia</h4>
          <p className="text-sm text-muted-foreground">
            {message.status === 'en-estudio' ? 'En Estudio' : 
             message.status === 'en-curso' ? 'En Curso' : 
             message.status === 'cerrada' ? 'Cerrada' : 'Desconocido'}
          </p>
        </div>

        {children}
      </CardContent>
    </Card>
  );
};