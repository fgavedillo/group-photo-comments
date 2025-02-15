
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useMessageSender = (onMessageSent: () => void) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendMessage = async (message: string, image?: File) => {
    try {
      setIsSending(true);

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

      let imageUrl;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: imageData, error: imageError } = await supabase.storage
          .from('images')
          .upload(fileName, image);

        if (imageError) {
          throw imageError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Construir el nombre de usuario a partir del perfil
      const username = profileData 
        ? `${profileData.first_name} ${profileData.last_name}`
        : "Usuario sin nombre";

      // Crear la incidencia con el user_id y username
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          message,
          user_id: session.user.id,
          username
        })
        .select()
        .single();

      if (issueError) throw issueError;

      if (imageUrl) {
        const { error: imageRelationError } = await supabase
          .from('issue_images')
          .insert([
            {
              issue_id: issue.id,
              image_url: imageUrl
            }
          ]);

        if (imageRelationError) throw imageRelationError;
      }

      onMessageSent();
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje se ha enviado correctamente",
      });

      // Redirigir a la pestaña de chat
      navigate('/?tab=chat');

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return { handleSendMessage, isSending };
};
