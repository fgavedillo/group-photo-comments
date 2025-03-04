
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useMessageSender = (onMessageSent: () => void) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string, image?: File) => {
    try {
      setIsSending(true);
      console.log("Enviando mensaje", { tieneImagen: !!image });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Subir imagen si existe
      let imageUrl: string | undefined;
      
      if (image) {
        console.log("Subiendo imagen", { fileName: image.name });
        
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const fileName = `${timestamp}-${session.user.id}${fileExt ? `.${fileExt}` : ''}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, image, {
            cacheControl: '3600',
            contentType: image.type
          });

        if (uploadError) {
          console.error("Error al subir imagen:", uploadError);
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log("Imagen subida correctamente", { publicUrl });
      }

      // Crear incidencia
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          message,
          user_id: session.user.id,
          status: 'en-estudio'
        })
        .select()
        .single();

      if (issueError) {
        console.error("Error al crear incidencia:", issueError);
        throw new Error(`Error al crear la incidencia: ${issueError.message}`);
      }

      // Vincular imagen si existe
      if (imageUrl && issue) {
        const { error: imageRecordError } = await supabase
          .from('issue_images')
          .insert({
            image_url: imageUrl,
            issue_id: issue.id
          });

        if (imageRecordError) {
          console.error("Error al registrar imagen:", imageRecordError);
          toast({
            title: "Advertencia",
            description: "Mensaje enviado pero hubo un problema al vincular la imagen",
            variant: "default"
          });
        }
      }

      onMessageSent();
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje se ha enviado correctamente",
      });

    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return { handleSendMessage, isSending };
};
