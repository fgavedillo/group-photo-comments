import { useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { MessageList, type Message } from "@/components/MessageList";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const handleSendMessage = async (text: string, image?: File) => {
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        username: "Usuario",
        timestamp: new Date(),
        message: text,
      };

      if (image) {
        newMessage.imageUrl = URL.createObjectURL(image);
      }

      // Intentar enviar el email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          to: "fgavedillo@gmail.com",
          subject: "Nuevo mensaje en el sistema",
          content: `Se ha recibido un nuevo mensaje: ${text}`
        }
      });

      if (error) {
        console.error("Error al enviar el email:", error);
        toast({
          title: "Error",
          description: "No se pudo enviar la notificación por email.",
          variant: "destructive"
        });
      } else {
        console.log("Email enviado correctamente:", data);
      }

      setMessages((prev) => [...prev, newMessage]);
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido publicado exitosamente.",
      });
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