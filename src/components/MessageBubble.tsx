import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      if (imageUrl) {
        // Delete from issue_images table
        const { error: imageError } = await supabase
          .from('issue_images')
          .delete()
          .eq('issue_id', id);

        if (imageError) throw imageError;
      }

      // Delete from issues table
      const { error: issueError } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);

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
    <div className="message-bubble animate-message-appear relative group">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-primary">{username}</h3>
        <span className="text-xs text-muted-foreground">
          {format(timestamp, "dd MMM yyyy, HH:mm", { locale: es })}
        </span>
      </div>
      
      {imageUrl && (
        <div 
          className="relative mb-3 animate-image-appear"
          onMouseEnter={() => setShowDeleteButton(true)}
          onMouseLeave={() => setShowDeleteButton(false)}
        >
          <img 
            src={imageUrl} 
            alt={`Compartido por ${username}`}
            className="message-image max-h-64 w-auto"
            loading="lazy"
          />
          {showDeleteButton && (
            <button
              onClick={handleDelete}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              title="Eliminar mensaje"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
      
      <p className="text-sm leading-relaxed text-foreground">{message}</p>
      
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
        title="Eliminar mensaje"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};