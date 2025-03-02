
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { IssueTable } from "@/components/IssueTable";
import { useMessages } from "@/hooks/useMessages";
import { useMessageSender } from "@/hooks/useMessageSender";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { messages, loadMessages, isLoading } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">
          Panel de Control
        </h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </Button>
      </header>

      <Tabs defaultValue="perfil" className="flex-1">
        <div className="sticky top-[4.5rem] bg-white z-40 border-b overflow-x-auto">
          <TabsList className="w-full h-auto justify-start rounded-none gap-2 px-2">
            <TabsTrigger value="perfil" className="px-2 py-1.5 sm:px-3 sm:py-2">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="kpis" className="px-2 py-1.5 sm:px-3 sm:py-2">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="px-2 py-1.5 sm:px-3 sm:py-2">
              Chat
            </TabsTrigger>
            <TabsTrigger value="issues" className="px-2 py-1.5 sm:px-3 sm:py-2">
              Gestión
            </TabsTrigger>
            <TabsTrigger value="table" className="px-2 py-1.5 sm:px-3 sm:py-2">
              Tabla
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto">
          <TabsContent value="perfil" className="h-full m-0 p-4">
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-2xl font-bold">Tu Perfil</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">
                  Bienvenido a tu panel de control. Desde aquí puedes acceder a todas las funcionalidades de la aplicación.
                </p>
                <p className="text-sm text-gray-600">
                  Utiliza la navegación superior para moverte entre las diferentes secciones.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="h-full m-0 p-4">
            <DashboardKPIs messages={messages} />
          </TabsContent>

          <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex flex-col">
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <MessageList messages={messages} onMessageDelete={loadMessages} />
              )}
            </div>
            <MessageInput onSend={handleSendMessage} />
          </TabsContent>
          
          <TabsContent value="issues" className="h-full m-0 data-[state=active]:flex flex-col">
            <IssueManagement messages={messages} />
          </TabsContent>

          <TabsContent value="table" className="h-full m-0 data-[state=active]:flex flex-col">
            <IssueTable issues={messages as unknown as Issue[]} onIssuesUpdate={loadMessages} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;
