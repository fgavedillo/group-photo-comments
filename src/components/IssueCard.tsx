import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ImageModal } from "./ImageModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IssueCardProps {
  message: any;
  index: number;
  onStatusChange: (issueId: number, status: Issue['status']) => void;
  onAreaChange: (issueId: number, area: string) => void;
  onResponsableChange: (issueId: number, responsable: string) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export const IssueCard = ({ 
  message, 
  index, 
  onStatusChange, 
  onAreaChange,
  onResponsableChange,
  onDelete,
  children 
}: IssueCardProps) => {
  const { toast } = useToast();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      if (message.imageUrl) {
        const { error: imageError } = await supabase
          .from('issue_images')
          .delete()
          .eq('issue_id', message.id);

        if (imageError) throw imageError;
      }

      const { error: issueError } = await supabase
        .from('issues')
        .delete()
        .eq('id', message.id);

      if (issueError) throw issueError;

      onDelete();
      
      toast({
        title: "Incidencia eliminada",
        description: "La incidencia se ha eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la incidencia",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg">Incidencia #{index + 1}</CardTitle>
          <CardDescription>
            Reportada por {message.username} el {message.timestamp.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message.imageUrl && (
            <>
              <img 
                src={message.imageUrl} 
                alt="Incidencia"
                className="w-full h-48 object-cover rounded-md cursor-pointer"
                onDoubleClick={() => setIsImageModalOpen(true)}
              />
              <ImageModal
                imageUrl={message.imageUrl}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
              />
            </>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`area-${message.id}`}>Área</Label>
              <Input
                id={`area-${message.id}`}
                placeholder="Área responsable"
                defaultValue={message.area || ''}
                onChange={(e) => onAreaChange(message.id, e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`responsable-${message.id}`}>Responsable</Label>
              <Input
                id={`responsable-${message.id}`}
                placeholder="Persona responsable"
                defaultValue={message.responsable || ''}
                onChange={(e) => onResponsableChange(message.id, e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado de la Incidencia</Label>
            <Select
              value={message.status}
              onValueChange={(value) => onStatusChange(message.id, value as Issue['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La incidencia será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};