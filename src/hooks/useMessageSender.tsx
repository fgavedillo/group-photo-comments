
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export const useMessageSender = (onMessageSent: () => void) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendMessage = async (message: string, image?: File) => {
    try {
      setIsSending(true);
      console.log("Starting message send process", { hasImage: !!image });

      // Obtener la sesión del usuario actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Obtener los datos del perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      let imageUrl = undefined;
      if (image) {
        console.log("Processing image upload", { fileName: image.name });
        
        // Asegurar que el nombre del archivo sea seguro y único
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const safeFileName = `${timestamp}-${session.user.id}.${fileExt}`;
        
        // Subir la imagen al bucket 'images'
        const { data: imageData, error: imageUploadError } = await supabase.storage
          .from('images')
          .upload(safeFileName, image, {
            cacheControl: '3600',
            contentType: image.type,
            upsert: false
          });

        if (imageUploadError) {
          console.error("Image upload error:", imageUploadError);
          throw new Error(`Error al subir la imagen: ${imageUploadError.message}`);
        }

        // Obtener la URL pública de la imagen
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(safeFileName);

        imageUrl = publicUrl;
        console.log("Image uploaded successfully", { imageUrl });
      }

      // Construir el nombre de usuario a partir del perfil
      const username = profileData 
        ? `${profileData.first_name} ${profileData.last_name}`
        : "Sin asignar";

      // Crear la incidencia con el user_id y username
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          message,
          user_id: session.user.id,
          username,
        })
        .select()
        .single();

      if (issueError) {
        console.error("Issue creation error:", issueError);
        throw new Error(`Error al crear la incidencia: ${issueError.message}`);
      }

      // Si hay una imagen, crear el registro en issue_images
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
      }

      onMessageSent();
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje se ha enviado correctamente",
      });

      // Redirigir a la pestaña de chat
      navigate('/?tab=chat');

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
