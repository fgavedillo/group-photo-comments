
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
import { LogOut, FileText, MessageSquare, BarChart2, Settings, CheckCircle, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { ReportButton } from "@/components/dashboard/ReportButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { messages, loadMessages, isLoading } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("chat");
  
  // Referencias para capturar elementos en la interfaz
  const dashboardRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen flex flex-col bg-gray-50 shadow-sm">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
          <Home className="h-5 w-5" />
          <span>PRLconecta</span>
        </h1>
        <div className="flex items-center gap-3">
          {currentTab === "kpis" && (
            <ReportButton dashboardRef={dashboardRef} issuesTableRef={tableRef} />
          )}
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </header>

      <Tabs 
        defaultValue="chat" 
        className="flex-1"
        onValueChange={(value) => setCurrentTab(value)}
      >
        <div className="sticky top-[4.5rem] bg-white z-40 border-b overflow-x-auto shadow-sm">
          <TabsList className="w-full h-14 justify-start rounded-none gap-1 px-6">
            <TabsTrigger value="chat" className="gap-2 px-4 py-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2 px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span>Gestión</span>
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2 px-4 py-2">
              <BarChart2 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2 px-4 py-2">
              <FileText className="h-4 w-4" />
              <span>Tabla</span>
            </TabsTrigger>
            <TabsTrigger value="perfil" className="gap-2 px-4 py-2">
              <Home className="h-4 w-4" />
              <span>Perfil</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
            <div className="sticky top-[7.5rem] z-30 bg-white border rounded-lg shadow-sm mb-4">
              <MessageInput onSend={handleSendMessage} className="max-w-4xl mx-auto" />
            </div>
            
            <div className="flex-1 overflow-auto pt-2 bg-white rounded-lg shadow-sm">
              {isLoading ? (
                <div className="flex items-center justify-center h-40 py-8">
                  <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <MessageList messages={messages} onMessageDelete={loadMessages} />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="issues" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
            <IssueManagement messages={messages} />
          </TabsContent>

          <TabsContent value="kpis" className="h-full m-0 animate-fade-in">
            <div ref={dashboardRef}>
              <DashboardKPIs messages={messages} />
            </div>
          </TabsContent>

          <TabsContent value="table" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
            <div ref={tableRef} className="bg-white rounded-lg shadow-sm p-4">
              <IssueTable issues={messages as unknown as Issue[]} onIssuesUpdate={loadMessages} />
            </div>
          </TabsContent>

          <TabsContent value="perfil" className="h-full m-0 animate-fade-in">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Tu Perfil</CardTitle>
                <CardDescription>
                  Bienvenido a tu espacio personal en PRLconecta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                  <p className="text-sm text-gray-600">
                    Bienvenido a tu espacio personal. Desde aquí puedes acceder a todas las funcionalidades de la aplicación.
                  </p>
                  <p className="text-sm text-gray-600">
                    Utiliza la navegación superior para moverte entre las diferentes secciones.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    <span>Configurar perfil</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <span>Ver informes</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;
