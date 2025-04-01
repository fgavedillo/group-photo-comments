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
import { LogOut, FileText, MessageSquare, BarChart2, Settings, CheckCircle, Home, Users } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";
import { ReportButton } from "@/components/dashboard/ReportButton";
import { ReportSenderButton } from "@/components/dashboard/ReportSenderButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagementTab } from "@/components/users/UserManagementTab";

const Dashboard = () => {
  const { messages, loadMessages, isLoading } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("chat");
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Referencias para capturar elementos en la interfaz
  const dashboardRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _role: 'admin'
        });
        
        if (isAdmin) {
          setUserRole('admin');
        } else {
          const { data: isUser } = await supabase.rpc('has_role', {
            _role: 'user'
          });
          
          if (isUser) {
            setUserRole('user');
          } else {
            setUserRole('pending');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, []);

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
            <>
              <ReportButton dashboardRef={dashboardRef} issuesTableRef={tableRef} />
              <ReportSenderButton />
            </>
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
              <Users className="h-4 w-4" />
              <span>Usuarios</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in relative">
          {/* Posicionamos la barra de chat directamente debajo del menú de navegación */}
          <div className="sticky top-[4.5rem] z-30 bg-white border-b shadow-sm">
            <MessageInput onSend={handleSendMessage} className="max-w-4xl mx-auto" />
          </div>
          
          <div className="flex-1 overflow-auto pt-1 bg-white rounded-lg shadow-sm mx-6 mt-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 py-8">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <MessageList messages={messages} onMessageDelete={loadMessages} />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="issues" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in p-6">
          <IssueManagement messages={messages} />
        </TabsContent>

        <TabsContent value="kpis" className="h-full m-0 animate-fade-in p-6">
          <div ref={dashboardRef}>
            <DashboardKPIs messages={messages} />
          </div>
        </TabsContent>

        <TabsContent value="table" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in p-6">
          <div ref={tableRef} className="bg-white rounded-lg shadow-sm p-4">
            <IssueTable issues={messages as unknown as Issue[]} onIssuesUpdate={loadMessages} />
          </div>
        </TabsContent>

        <TabsContent value="perfil" className="h-full m-0 animate-fade-in p-6">
          <Card className="max-w-4xl mx-auto mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios que tienen acceso a PRLconecta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
