
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const useMessageSender = (onMessageSent: () => void) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string, image?: File) => {
    try {
      setIsSending(true);
      console.log("Starting message send process", { hasImage: !!image });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Primero subimos la imagen si existe
      let imageUrl: string | undefined;
      
      if (image) {
        console.log("Processing image upload", { fileName: image.name });
        
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const fileName = `${timestamp}-${session.user.id}${fileExt ? `.${fileExt}` : ''}`;
        
        // Subir la imagen al bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, image, {
            cacheControl: '3600',
            contentType: image.type
          });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        // Obtener la URL pública de la imagen
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log("Image uploaded successfully", { publicUrl });
      }

      // Luego creamos la incidencia
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
        console.error("Issue creation error:", issueError);
        throw new Error(`Error al crear la incidencia: ${issueError.message}`);
      }

      // Si tenemos una imagen, creamos el registro en issue_images
      if (imageUrl && issue) {
        const { error: imageRecordError } = await supabase
          .from('issue_images')
          .insert({
            image_url: imageUrl,
            issue_id: issue.id
          });

        if (imageRecordError) {
          console.error("Image record creation error:", imageRecordError);
          throw new Error(`Error al registrar la imagen: ${imageRecordError.message}`);
        }

        console.log("Image record created successfully");
      }

      onMessageSent();
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje se ha enviado correctamente",
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
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
