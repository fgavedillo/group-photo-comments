import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ImageModal } from "./ImageModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface IssueCardProps {
  message: any;
  index: number;
  onStatusChange: (issueId: number, status: string) => void;
  onAreaChange: (issueId: number, area: string) => void;
  onResponsableChange: (issueId: number, responsable: string) => void;
  onDelete: () => void;
  securityImprovements: { [key: string]: string };
  actionPlans: { [key: string]: string };
  onSecurityImprovementChange: (issueId: number, value: string) => void;
  onActionPlanChange: (issueId: number, value: string) => void;
  onAddSecurityImprovement: (issueId: number) => void;
  onAssignedEmailChange: (issueId: number, value: string) => void;
}

const IssueCard = ({
  message,
  index,
  onStatusChange,
  onAreaChange,
  onResponsableChange,
  onDelete,
  securityImprovements,
  actionPlans,
  onSecurityImprovementChange,
  onActionPlanChange,
  onAddSecurityImprovement,
  onAssignedEmailChange,
}: IssueCardProps) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cerrada':
        return 'border-green-500';
      case 'en-curso':
        return 'border-yellow-500';
      case 'denegado':
        return 'border-red-500';
      default:
        return 'border-gray-200';
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', message.id);

      if (error) throw error;

      toast({
        title: "Incidencia eliminada",
        description: "La incidencia ha sido eliminada correctamente",
      });

      onDelete();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la incidencia",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={cn("w-[350px] flex-shrink-0 relative", getStatusColor(message.status))}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{message.username}</CardTitle>
            <CardDescription>
              {new Date(message.timestamp).toLocaleString()}
            </CardDescription>
          </div>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la incidencia.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={message.status}
            onValueChange={(value) => onStatusChange(message.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-estudio">En estudio</SelectItem>
              <SelectItem value="en-curso">En curso</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
              <SelectItem value="denegado">Denegado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Área</Label>
          <Select
            value={message.area || ""}
            onValueChange={(value) => onAreaChange(message.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="produccion">Producción</SelectItem>
              <SelectItem value="calidad">Calidad</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="logistica">Logística</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Responsable</Label>
          <Select
            value={message.responsable || ""}
            onValueChange={(value) => onResponsableChange(message.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="juan">Juan Pérez</SelectItem>
              <SelectItem value="maria">María García</SelectItem>
              <SelectItem value="pedro">Pedro López</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Email asignado</Label>
          <Input
            type="email"
            value={message.assigned_email || ""}
            onChange={(e) => onAssignedEmailChange(message.id, e.target.value)}
            placeholder="ejemplo@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Mejora de seguridad</Label>
          <Textarea
            value={message.security_improvement || ""}
            onChange={(e) => onSecurityImprovementChange(message.id, e.target.value)}
            placeholder="Describe la mejora de seguridad..."
            className="min-h-[100px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label>Plan de acción</Label>
          <Textarea
            value={message.action_plan || ""}
            onChange={(e) => onActionPlanChange(message.id, e.target.value)}
            placeholder="Describe el plan de acción..."
            className="min-h-[100px] resize-y"
          />
        </div>

        {message.imageUrl && (
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full flex justify-between items-center"
              onClick={() => setIsImageExpanded(!isImageExpanded)}
            >
              <span>Ver imagen</span>
              {isImageExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isImageExpanded && (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <img
                      src={message.imageUrl}
                      alt="Issue"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Imagen de la incidencia</DialogTitle>
                  </DialogHeader>
                  <img
                    src={message.imageUrl}
                    alt="Issue full size"
                    className="w-full h-auto"
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IssueCard;