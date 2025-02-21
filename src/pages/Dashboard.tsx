
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { IssueTable } from "@/components/IssueTable";
import { ReportsManagement } from "@/components/ReportsManagement";
import { useMessages } from "@/hooks/useMessages";
import { useMessageSender } from "@/hooks/useMessageSender";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const Dashboard = () => {
  const { messages, loadMessages } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Panel de Control
        </h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </header>

      <Tabs defaultValue="chat" className="flex-1">
        <div className="sticky top-[4.5rem] bg-white z-40 border-b">
          <TabsList className="w-full h-auto justify-start rounded-none gap-2 px-4 py-2">
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

export default Dashboard;
