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
    if (!message.trim() && !image) {
      toast({
        title: "Error",
        description: "Debes incluir un mensaje o una imagen",
        variant: "destructive"
      });
      return;
    }

    console.log('========= INICIO PROCESO DE ENVÍO DE MENSAJE =========');
    console.log('Mensaje a enviar:', message);
    console.log('Imagen adjunta:', image ? 'Sí' : 'No');

    // Activar indicador de carga
    setIsSending(true);

    try {
      // Verificar si hay una sesión de usuario activa
      console.log('Verificando sesión de usuario...');
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Datos de sesión:', sessionData);
      
      // Crear la nueva incidencia en la tabla issues con campos mínimos obligatorios
      console.log('Insertando mensaje en la tabla "issues"...');
      
      // Definir datos básicos para inserción
      const issueData = {
        message: message.trim() || "(Imagen)",
        // Incluimos user_id solo si el usuario está autenticado
        ...(sessionData?.session?.user?.id && { user_id: sessionData.session.user.id }),
        // Asegurar que status sea "en-estudio" por defecto para garantizar compatibilidad
        status: 'en-estudio' 
      };
      
      console.log('Datos a insertar:', issueData);
      
      // Insertar en la tabla issues
      const { data: createdIssue, error: issueError } = await supabase
        .from("issues")
        .insert([issueData])
        .select()
        .single();

      if (issueError) {
        console.error('Error detallado al insertar mensaje:', issueError);
        throw new Error(`Error al guardar el mensaje: ${issueError.message}`);
      }

      if (!createdIssue) {
        console.error('No se recibieron datos de la incidencia creada');
        throw new Error("No se pudo crear el mensaje");
      }

      console.log('Mensaje insertado correctamente. ID:', createdIssue.id);

      // Procesar imagen si se ha adjuntado una
      if (image) {
        console.log('Procesando imagen adjunta...');
        
        try {
          // Generar un nombre único para la imagen usando el ID de la incidencia y timestamp
          const imageName = `issue_${createdIssue.id}_${Date.now()}.jpg`;
          
          // Subir la imagen al bucket de almacenamiento
          console.log('Subiendo imagen al bucket "issue-images"...');
          const { data: storageData, error: storageError } = await supabase.storage
            .from("issue-images")
            .upload(imageName, image);

          if (storageError) {
            console.error("Error al subir la imagen:", storageError);
            // No lanzamos error aquí, continuamos para mantener al menos el mensaje de texto
            toast({
              title: "Advertencia",
              description: "Se envió el mensaje, pero hubo un problema al subir la imagen",
              variant: "warning",
            });
          } else {
            // Obtener URL pública de la imagen subida
            console.log('Imagen subida correctamente. Obteniendo URL pública...');
            const imageUrl = supabase.storage
              .from("issue-images")
              .getPublicUrl(imageName).data.publicUrl;

            console.log('URL pública de la imagen:', imageUrl);

            // Asociar la URL de la imagen con la incidencia en la tabla issue_images
            console.log('Asociando imagen con la incidencia en la tabla "issue_images"...');
            const { error: updateError } = await supabase
              .from("issue_images")
              .insert([
                { issue_id: createdIssue.id, image_url: imageUrl }
              ]);

            if (updateError) {
              console.error("Error al asociar imagen:", updateError);
              toast({
                title: "Advertencia",
                description: "Mensaje enviado, pero hubo un problema al asociar la imagen",
                variant: "warning",
              });
            } else {
              console.log('Imagen asociada correctamente con la incidencia');
            }
          }
        } catch (imageError) {
          console.error("Error en el proceso de la imagen:", imageError);
          toast({
            title: "Advertencia",
            description: "Mensaje enviado, pero hubo un problema con la imagen",
            variant: "warning",
          });
        }
      }

      // Mostrar confirmación de éxito
      console.log('Mensaje enviado exitosamente');
      toast({
        title: "Éxito",
        description: "Mensaje enviado correctamente",
      });

      // Ejecutar callback para que la aplicación pueda actualizarse
      console.log('Ejecutando callback onMessageSent para actualizar la UI');
      onMessageSent();
      console.log('========= FIN PROCESO DE ENVÍO DE MENSAJE =========');
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      
      // Mostrar error al usuario
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
      console.log('========= ERROR EN PROCESO DE ENVÍO DE MENSAJE =========');
    } finally {
      // Desactivar indicador de carga independientemente del resultado
      setIsSending(false);
    }
  };

  return { handleSendMessage, isSending };
};
