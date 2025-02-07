
import { useState, useEffect } from "react";
import { MessageInput } from "@/components/MessageInput";
import { MessageList, type Message } from "@/components/MessageList";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { IssueTable } from "@/components/IssueTable";
import { ReportsManagement } from "@/components/ReportsManagement";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/supabase";
import { Issue } from "@/types/issue";

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
        imageUrl: issue.issue_images?.[0]?.image_url || undefined,
        status: issue.status,
        area: issue.area,
        responsable: issue.responsable,
        security_improvement: issue.security_improvement,
        action_plan: issue.action_plan,
        assigned_email: issue.assigned_email
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
      <header className="bg-white border-b border-gray-100 p-2 sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-foreground">
          Sistema de Gestión de Incidencias
        </h1>
      </header>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="sticky top-[4.5rem] bg-white z-40 border-b">
          <TabsList className="w-full justify-start rounded-none border-b">
            <TabsTrigger value="chat" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Chat
            </TabsTrigger>
            <TabsTrigger value="issues" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Gestión de Incidencias
            </TabsTrigger>
            <TabsTrigger value="table" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Tabla de Incidencias
            </TabsTrigger>
            <TabsTrigger value="kpis" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Indicadores
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Gestión de Reportes
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="flex-1 flex flex-col h-[calc(100vh-8rem)] p-0 mt-0">
          <MessageList messages={messages} onMessageDelete={loadMessages} />
          <MessageInput onSend={handleSendMessage} />
        </TabsContent>
        
        <TabsContent value="issues" className="flex-1 h-[calc(100vh-8rem)] overflow-auto p-0 mt-0">
          <IssueManagement messages={messages} />
        </TabsContent>

        <TabsContent value="table" className="flex-1 h-[calc(100vh-8rem)] overflow-auto p-0 mt-0">
          <IssueTable issues={messages as unknown as Issue[]} />
        </TabsContent>
        
        <TabsContent value="kpis" className="flex-1 h-[calc(100vh-8rem)] overflow-auto p-0 mt-0">
          <DashboardKPIs messages={messages} />
        </TabsContent>

        <TabsContent value="reports" className="flex-1 h-[calc(100vh-8rem)] overflow-auto p-0 mt-0">
          <ReportsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
