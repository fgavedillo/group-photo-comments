import { useState, useEffect } from "react";
import { MessageInput } from "@/components/MessageInput";
import { MessageList, type Message } from "@/components/MessageList";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Auth } from "@/components/Auth";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    checkUser();

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

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
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      console.log("Iniciando envío de mensaje...");
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Usuario actual:", user);
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para enviar mensajes",
          variant: "destructive"
        });
        return;
      }

      // Primero creamos la incidencia
      console.log("Creando incidencia...");
      const { data: issueData, error: issueError } = await supabase
        .from('issues')
        .insert({
          message: text,
          username: "Usuario",
          user_id: user.id,
          timestamp: new Date().toISOString()
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
        const fileName = `${Date.now()}-${user.id}.${image.name.split('.').pop()}`;
        
        // Subir al almacenamiento
        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, image);

        if (uploadError) {
          console.error("Error subiendo imagen:", uploadError);
          throw uploadError;
        }

        console.log("Imagen subida correctamente");

        // Obtener la URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName);

        console.log("URL pública de la imagen:", publicUrl);

        // Crear el registro de la imagen
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

  if (showAuth) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">
          Sistema de Gestión de Incidencias
        </h1>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut()}
            >
              Cerrar Sesión
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowAuth(true)}>
            Iniciar Sesión
          </Button>
        )}
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
