
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useMessageSender = (onMessageSent: () => void) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string, image?: File) => {
    if (isSending) return;
    
    try {
      setIsSending(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Debes iniciar sesión para enviar mensajes");
      }

      let imageUrl: string | undefined;
      
      if (image) {
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const fileName = `${timestamp}-${session.user.id}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          message: message.trim(),
          user_id: session.user.id
        })
        .select()
        .single();

      if (issueError) {
        throw new Error(`Error al crear la incidencia: ${issueError.message}`);
      }

      if (imageUrl && issue) {
        const { error: imageRecordError } = await supabase
          .from('issue_images')
          .insert({
            image_url: imageUrl,
            issue_id: issue.id
          });

        if (imageRecordError) {
          throw new Error(`Error al registrar la imagen: ${imageRecordError.message}`);
        }
      }

      onMessageSent();

    } catch (error: any) {
      console.error('Error en el envío del mensaje:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
      throw error; // Re-lanzar el error para que MessageInput pueda manejarlo
    } finally {
      setIsSending(false);
    }
  };

  return { handleSendMessage, isSending };
};
