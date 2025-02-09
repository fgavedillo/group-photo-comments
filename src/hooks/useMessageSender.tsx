
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/supabase";

export const useMessageSender = (onMessageSent: () => Promise<void>) => {
  const { toast } = useToast();

  const handleSendMessage = async (text: string, image?: File) => {
    try {
      console.log("Iniciando envío de mensaje...");
      
      const { data: issueData, error: issueError } = await supabase
        .from('issues')
        .insert({
          message: text,
          username: "Usuario",
          timestamp: new Date().toISOString(),
          status: "en-estudio"
        })
        .select()
        .single();

      if (issueError) {
        console.error("Error creando incidencia:", issueError);
        throw issueError;
      }

      if (image && issueData) {
        const fileName = `${Date.now()}-anon.${image.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, image);

        if (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName);

        const { error: imageError } = await supabase
          .from('issue_images')
          .insert({
            issue_id: issueData.id,
            image_url: publicUrl
          });

        if (imageError) {
          console.error("Error creando registro de imagen:", imageError);
          throw imageError;
        }
      }

      await onMessageSent();
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido publicado exitosamente",
      });

      await sendEmail(
        "fgavedillo@gmail.com",
        "Nuevo mensaje en el sistema",
        `Se ha recibido un nuevo mensaje: ${text}`
      );
    } catch (error) {
      console.error("Error al procesar el mensaje:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  return { handleSendMessage };
};
