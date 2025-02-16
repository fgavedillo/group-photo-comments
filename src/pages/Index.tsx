
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { IssueTable } from "@/components/IssueTable";
import { ReportsManagement } from "@/components/ReportsManagement";
import { useMessages } from "@/hooks/useMessages";
import { useMessageSender } from "@/hooks/useMessageSender";
import { WelcomePage } from "@/components/WelcomePage";
import { Issue } from "@/types/issue";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { messages, loadMessages } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      try {
        const { data: roleData, error: roleError } = await supabase.rpc('has_role', {
          _role: 'pending'
        });

        if (roleError) throw roleError;

        if (roleData) {
          setUserRole('pending');
          toast({
            title: "Acceso pendiente",
            description: "Tu cuenta está pendiente de aprobación por un administrador.",
            variant: "warning",
          });
        } else {
          // Check if user is approved (has 'user' or 'admin' role)
          const { data: isApproved } = await supabase.rpc('has_role', {
            _role: 'user'
          });
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _role: 'admin'
          });

          if (isApproved) {
            setUserRole('user');
          } else if (isAdmin) {
            setUserRole('admin');
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };

    checkUserAccess();
  }, [navigate]);

  const isAccessRestricted = userRole === 'pending';

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
            {!isAccessRestricted && (
              <>
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
              </>
            )}
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto">
          <TabsContent value="inicio" className="h-full m-0 p-4">
            <WelcomePage />
            {isAccessRestricted && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h2 className="text-lg font-semibold text-yellow-800">Acceso Pendiente</h2>
                <p className="text-yellow-700">
                  Tu cuenta está pendiente de aprobación por un administrador. Solo podrás acceder al contenido completo después de que tu cuenta sea aprobada.
                </p>
              </div>
            )}
          </TabsContent>

          {!isAccessRestricted && (
            <>
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
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Index;
