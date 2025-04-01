/**
 * Hook personalizado para gestionar el envío de mensajes/incidencias
 * Permite enviar mensajes de texto con imágenes opcionales a la base de datos
 */
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * @param onMessageSent - Función de callback que se ejecutará cuando un mensaje sea enviado exitosamente
 * @returns Objeto con la función para enviar mensajes y el estado de carga
 */
export const useMessageSender = (onMessageSent: () => void) => {
  // Estado para controlar si se está enviando un mensaje
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  /**
   * Maneja el proceso de envío de un mensaje a la base de datos
   * 
   * @param message - Texto del mensaje a enviar
   * @param image - Archivo de imagen opcional para adjuntar al mensaje
   */
  const handleSendMessage = async (message: string, image?: File) => {
    // Validación básica: el mensaje no puede estar vacío
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    // Activar indicador de carga
    setIsSending(true);

    try {
      // Verificar si hay una sesión de usuario activa
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No se encontró una sesión activa");
      }

      // Crear la nueva incidencia en la tabla issues
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

      // Procesar imagen si se ha adjuntado una
      if (image) {
        // Generar un nombre único para la imagen usando el ID de la incidencia y timestamp
        const imageName = `issue_${issueData.id}_${Date.now()}.jpg`;
        
        // Subir la imagen al bucket de almacenamiento
        const { data: storageData, error: storageError } = await supabase.storage
          .from("issue-images")
          .upload(imageName, image);

        if (storageError) {
          console.error("Error al subir la imagen:", storageError);
          // Continuar sin imagen si hay un error
        } else {
          // Obtener URL pública de la imagen subida
          const imageUrl = supabase.storage
            .from("issue-images")
            .getPublicUrl(imageName).data.publicUrl;

          // Asociar la URL de la imagen con la incidencia en la tabla issue_images
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

      // Mostrar confirmación de éxito
      toast({
        title: "Éxito",
        description: "Mensaje enviado correctamente",
      });

      // Ejecutar callback para que la aplicación pueda actualizarse
      onMessageSent();
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      
      // Mostrar error al usuario
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      // Desactivar indicador de carga independientemente del resultado
      setIsSending(false);
    }
  };

  return { handleSendMessage, isSending };
};
