
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
    <div className="min-h-screen flex flex-col bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-2 sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-foreground">
          Sistema de Gestión de Incidencias
        </h1>
      </header>

      <Tabs defaultValue="inicio" className="flex-1">
        <div className="sticky top-[3.5rem] bg-white z-40 border-b">
          <TabsList className="w-full h-auto justify-start rounded-none gap-2 px-2">
            <TabsTrigger value="inicio">
              Inicio
            </TabsTrigger>
            <TabsTrigger value="chat">
              Chat
            </TabsTrigger>
            <TabsTrigger value="issues">
              Gestión de Incidencias
            </TabsTrigger>
            <TabsTrigger value="table">
              Tabla de Incidencias
            </TabsTrigger>
            <TabsTrigger value="kpis">
              Indicadores
            </TabsTrigger>
            <TabsTrigger value="reports">
              Gestión de Reportes
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto">
          <TabsContent value="inicio" className="h-full m-0 p-4">
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-center mb-8">Bienvenido al Sistema de Gestión de Incidencias</h2>
              <p className="text-gray-600 text-center">
                Por favor, identifíquese para acceder al sistema.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex flex-col">
            <div className="flex-1 overflow-auto">
              <MessageList messages={messages} onMessageDelete={loadMessages} />
            </div>
            <MessageInput onSend={handleSendMessage} />
          </TabsContent>
          
          <TabsContent value="issues" className="h-full m-0 data-[state=active]:flex flex-col">
            <IssueManagement messages={messages} />
          </TabsContent>

          <TabsContent value="table" className="h-full m-0 data-[state=active]:flex flex-col">
            <IssueTable issues={messages as unknown as Issue[]} onIssuesUpdate={loadMessages} />
          </TabsContent>
          
          <TabsContent value="kpis" className="h-full m-0 data-[state=active]:flex flex-col">
            <DashboardKPIs messages={messages} />
          </TabsContent>

          <TabsContent value="reports" className="h-full m-0 data-[state=active]:flex flex-col">
            <ReportsManagement />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Index;
