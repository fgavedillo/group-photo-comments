
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

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Error al obtener el perfil del usuario");
      }

      let imageUrl = undefined;
      if (image) {
        console.log("Processing image upload", { fileName: image.name });
        
        const timestamp = Date.now();
        const fileExt = image.name.split('.').pop();
        const safeFileName = `${timestamp}-${session.user.id}.${fileExt}`;
        
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

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(safeFileName);

        imageUrl = publicUrl;
        console.log("Image uploaded successfully", { imageUrl });
      }

      // Crear la incidencia con la información del perfil
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          message,
          username: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          user_id: session.user.id
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
