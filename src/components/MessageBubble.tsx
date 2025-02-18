
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, CheckCheck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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

interface MessageBubbleProps {
  id: string;
  username: string;
  timestamp: Date;
  message: string;
  imageUrl?: string;
  onDelete: () => void;
}

export const MessageBubble = ({ id, username, timestamp, message, imageUrl, onDelete }: MessageBubbleProps) => {
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      if (imageUrl) {
        const { error: imageError } = await supabase
          .from('issue_images')
          .delete()
          .eq('issue_id', parseInt(id));

        if (imageError) throw imageError;
      }

      const { error: issueError } = await supabase
        .from('issues')
        .delete()
        .eq('id', parseInt(id));

      if (issueError) throw issueError;

      onDelete();
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje se ha eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="message-bubble animate-message-appear relative group flex flex-col items-end">
        <div className="max-w-[80%] bg-secondary rounded-lg rounded-tr-none p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm text-primary">{username}</h3>
          </div>
          
          {imageUrl && (
            <>
              <div 
                className="relative mb-3 animate-image-appear"
                onMouseEnter={() => setShowDeleteButton(true)}
                onMouseLeave={() => setShowDeleteButton(false)}
              >
                <img 
                  src={imageUrl} 
                  alt={`Compartido por ${username}`}
                  className="rounded-md max-h-64 w-auto cursor-pointer"
                  loading="lazy"
                  onDoubleClick={() => setIsImageModalOpen(true)}
                />
                {showDeleteButton && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="absolute top-2 right-2 p-2 bg-white/50 text-gray-700 rounded-full hover:bg-white/70 transition-colors"
                    title="Eliminar mensaje"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <ImageModal
                imageUrl={imageUrl}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
              />
            </>
          )}
          
          <p className="text-sm leading-relaxed text-foreground break-words">{message}</p>
          
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs text-muted-foreground">
              {format(timestamp, "HH:mm", { locale: es })}
            </span>
            <CheckCheck size={16} className="text-primary" />
          </div>
        </div>
        
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="absolute top-2 right-2 p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
          title="Eliminar mensaje"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
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
