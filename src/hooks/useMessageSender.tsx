
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useMessageSender = (onMessageSent: () => void) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (message: string, image?: File) => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      // Obtener la sesión del usuario
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No se encontró una sesión activa");
      }

      // Crear la nueva incidencia en la base de datos
      const { data: issueData, error: issueError } = await supabase
        .from("issues")
        .insert([
          { message }
        ])
        .select()
        .single();

      if (issueError) {
        throw issueError;
      }

      // Si se adjuntó una imagen, procesarla
      if (image) {
        const imageName = `issue_${issueData.id}_${Date.now()}.jpg`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from("issue-images")
          .upload(imageName, image);

        if (storageError) {
          console.error("Error al subir la imagen:", storageError);
          // Continuar sin imagen
        } else {
          // Obtener URL pública de la imagen
          const imageUrl = supabase.storage
            .from("issue-images")
            .getPublicUrl(imageName).data.publicUrl;

          // Actualizar la incidencia con la URL de la imagen
          const { error: updateError } = await supabase
            .from("issue_images")
            .insert([
              { issue_id: issueData.id, image_url: imageUrl }
            ]);

          if (updateError) {
            console.error("Error al asociar imagen:", updateError);
          }
        }
      }

      toast({
        title: "Éxito",
        description: "Mensaje enviado correctamente",
      });

      onMessageSent();
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      
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
