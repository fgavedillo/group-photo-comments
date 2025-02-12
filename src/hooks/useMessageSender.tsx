
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/supabase";
import { saveOfflineMessage, getPendingMessages, markMessageAsSent } from "@/utils/offlineStorage";

export const useMessageSender = (onMessageSent: () => Promise<void>) => {
  const { toast } = useToast();

  const syncOfflineMessages = async () => {
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        await handleSendMessage(message.message, message.image, message.id);
      } catch (error) {
        console.error("Error syncing offline message:", error);
      }
    }
  };

  // Escuchar cambios en la conectividad
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      toast({
        title: "Conexión restaurada",
        description: "Sincronizando mensajes pendientes...",
      });
      syncOfflineMessages();
    });
  }

  const handleSendMessage = async (text: string, image?: File, offlineId?: string) => {
    const isOnline = navigator.onLine;

    if (!isOnline) {
      try {
        await saveOfflineMessage(text, image);
        toast({
          title: "Mensaje guardado",
          description: "Se enviará cuando haya conexión a internet",
        });
        return;
      } catch (error) {
        console.error("Error saving offline message:", error);
        toast({
          title: "Error",
          description: "No se pudo guardar el mensaje offline",
          variant: "destructive"
        });
        return;
      }
    }

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

      if (offlineId) {
        await markMessageAsSent(offlineId);
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
      
      if (navigator.onLine) {
        toast({
          title: "Error",
          description: "Hubo un problema al enviar el mensaje",
          variant: "destructive"
        });
      } else {
        // Si perdimos la conexión durante el envío, guardamos el mensaje offline
        await saveOfflineMessage(text, image);
        toast({
          title: "Sin conexión",
          description: "El mensaje se enviará cuando haya conexión",
        });
      }
    }
  };

  return { handleSendMessage };
};
