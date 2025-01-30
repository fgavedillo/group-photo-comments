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
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (text: string, image?: File) => {
    try {
      let imageUrl = '';
      
      if (image) {
        const fileName = `${Date.now()}.${image.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      const { data: issueData, error: issueError } = await supabase
        .from('issues')
        .insert({
          message: text,
          username: "Usuario",
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (issueError) throw issueError;

      if (imageUrl) {
        const { error: imageError } = await supabase
          .from('issue_images')
          .insert({
            issue_id: issueData.id,
            image_url: imageUrl
          });

        if (imageError) throw imageError;
      }

      await loadMessages();
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido publicado exitosamente.",
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
        description: "Hubo un problema al enviar el mensaje.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-semibold text-center text-foreground">
          Sistema de Gestión de Incidencias
        </h1>
      </header>

      <Tabs defaultValue="chat" className="flex-1">
        <TabsList className="w-full justify-start border-b px-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="issues">Gestión de Incidencias</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 flex flex-col">
          <MessageList messages={messages} />
          <MessageInput onSend={handleSendMessage} />
        </TabsContent>
        
        <TabsContent value="issues">
          <IssueManagement messages={messages} />
        </TabsContent>
        
        <TabsContent value="kpis">
          <DashboardKPIs messages={messages} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;