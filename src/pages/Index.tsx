import { useState, useEffect } from "react";
import { MessageInput } from "@/components/MessageInput";
import { MessageList, type Message } from "@/components/MessageList";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/supabase";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select(`
          *,
          issue_images (
            image_url
          )
        `)
        .order('timestamp', { ascending: true });

      if (issuesError) throw issuesError;

      const formattedMessages = issuesData.map(issue => ({
        id: issue.id.toString(),
        username: issue.username,
        timestamp: new Date(issue.timestamp),
        message: issue.message,
        imageUrl: issue.issue_images?.[0]?.image_url || undefined
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (text: string, image?: File) => {
    try {
      console.log("Iniciando envío de mensaje...");
      
      // Crear la incidencia con estado inicial
      console.log("Creando incidencia...");
      const { data: issueData, error: issueError } = await supabase
        .from('issues')
        .insert({
          message: text,
          username: "Usuario",
          timestamp: new Date().toISOString(),
          status: "en-estudio" // Establecemos el estado automáticamente
        })
        .select()
        .single();

      if (issueError) {
        console.error("Error creando incidencia:", issueError);
        throw issueError;
      }

      console.log("Incidencia creada:", issueData);

      // Si hay una imagen, la subimos y creamos el registro
      if (image && issueData) {
        console.log("Subiendo imagen...");
        const fileName = `${Date.now()}-anon.${image.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, image);

        if (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          throw uploadError;
        }

        console.log("Imagen subida correctamente");

        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName);

        console.log("URL pública de la imagen:", publicUrl);

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

        console.log("Registro de imagen creado correctamente");
      }

      await loadMessages();
      
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

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-2">
        <h1 className="text-lg font-semibold text-foreground">
          Sistema de Gestión de Incidencias
        </h1>
      </header>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="issues">Gestión de Incidencias</TabsTrigger>
          <TabsTrigger value="kpis">Indicadores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col h-[calc(100vh-8rem)] p-0 mt-0">
          <MessageList messages={messages} onMessageDelete={loadMessages} />
          <MessageInput onSend={handleSendMessage} />
        </TabsContent>
        
        <TabsContent value="issues" className="flex-1 h-[calc(100vh-8rem)] overflow-auto p-0 mt-0">
          <IssueManagement messages={messages} />
        </TabsContent>
        
        <TabsContent value="kpis" className="flex-1 h-[calc(100vh-8rem)] overflow-auto p-0 mt-0">
          <DashboardKPIs messages={messages} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;