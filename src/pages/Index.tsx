
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { IssueTable } from "@/components/IssueTable";
import { useMessages } from "@/hooks/useMessages";
import { useMessageSender } from "@/hooks/useMessageSender";
import { WelcomePage } from "@/components/WelcomePage";
import { Issue } from "@/types/issue";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, LayoutList, BarChart2, FileText, Home } from "lucide-react";

const Index = () => {
  const { messages, loadMessages } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const notifyAdmin = async (userEmail: string, userName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('notify-admin', {
        body: { userEmail, userName }
      });

      console.log('Respuesta de la función:', response);

      if (response.error) {
        console.error('Error response:', response.error);
        throw new Error('Error al enviar la notificación');
      }

      console.log('Notificación enviada al administrador');
    } catch (error) {
      console.error('Error al notificar al administrador:', error);
      toast({
        title: "Error",
        description: "No se pudo notificar al administrador",
        variant: "destructive",
      });
    }
  };

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
            variant: "default",
          });

          const { data: userData } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
            await notifyAdmin(userData.email || session.user.email || '', fullName);
          }
        } else {
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
          <Home className="h-5 w-5" />
          <span>Sistema de Gestión de Incidencias</span>
        </h1>
      </header>

      <Tabs defaultValue="inicio" className="flex-1">
        <div className="sticky top-[4.5rem] bg-white z-40 border-b shadow-sm">
          <TabsList className="w-full h-14 justify-start rounded-none gap-1 px-6">
            <TabsTrigger value="inicio" className="gap-2 px-4 py-2">
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </TabsTrigger>
            {!isAccessRestricted && (
              <>
                <TabsTrigger value="chat" className="gap-2 px-4 py-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger value="issues" className="gap-2 px-4 py-2">
                  <LayoutList className="h-4 w-4" />
                  <span>Gestión de Incidencias</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2 px-4 py-2">
                  <FileText className="h-4 w-4" />
                  <span>Tabla de Incidencias</span>
                </TabsTrigger>
                <TabsTrigger value="kpis" className="gap-2 px-4 py-2">
                  <BarChart2 className="h-4 w-4" />
                  <span>Indicadores</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <TabsContent value="inicio" className="h-full m-0 animate-fade-in">
            <WelcomePage />
            {isAccessRestricted && (
              <Card className="mt-6 border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-yellow-800">Acceso Pendiente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700">
                    Tu cuenta está pendiente de aprobación por un administrador. Solo podrás acceder al contenido completo después de que tu cuenta sea aprobada.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isAccessRestricted && (
            <>
              <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
                <div className="sticky top-[7.5rem] z-30 bg-white border rounded-lg shadow-sm mb-4">
                  <MessageInput onSend={handleSendMessage} className="max-w-4xl mx-auto" />
                </div>
                
                <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm">
                  <MessageList messages={messages} onMessageDelete={loadMessages} />
                </div>
              </TabsContent>
              
              <TabsContent value="issues" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
                <IssueManagement messages={messages} />
              </TabsContent>

              <TabsContent value="table" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <IssueTable issues={messages as unknown as Issue[]} onIssuesUpdate={loadMessages} />
                </div>
              </TabsContent>
              
              <TabsContent value="kpis" className="h-full m-0 data-[state=active]:flex flex-col animate-fade-in">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <DashboardKPIs messages={messages} />
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Index;
