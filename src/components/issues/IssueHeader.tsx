
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface IssueHeaderProps {
  username: string;
  timestamp: Date;
  isEditDialogOpen: boolean;
  onEditDialogChange: (open: boolean) => void;
  isDeleteDialogOpen: boolean;
  onDeleteDialogChange: (open: boolean) => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export const IssueHeader = ({
  username,
  timestamp,
  isEditDialogOpen,
  onEditDialogChange,
  isDeleteDialogOpen,
  onDeleteDialogChange,
  onDelete,
  children
}: IssueHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">{username}</CardTitle>
          <CardDescription>
            {new Date(timestamp).toLocaleString()}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={onEditDialogChange}>
            <Button variant="ghost" size="icon" onClick={() => onEditDialogChange(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>Editar incidencia</DialogTitle>
              </DialogHeader>
              {children}
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={onDeleteDialogChange}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente la incidencia.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => onDeleteDialogChange(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </CardHeader>
  );
};

