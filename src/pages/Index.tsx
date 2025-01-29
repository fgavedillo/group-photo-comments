import { useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { MessageList, type Message } from "@/components/MessageList";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueManagement } from "@/components/IssueManagement";
import { DashboardKPIs } from "@/components/DashboardKPIs";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/supabase";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  // Función para probar el envío de correo
  const testEmail = async () => {
    try {
      await sendEmail(
        "fgavedillo@gmail.com",
        "Prueba de envío de correo",
        `
        <h1>Prueba de envío de correo</h1>
        <p>Este es un correo de prueba enviado desde la aplicación.</p>
        <p>Fecha y hora: ${new Date().toLocaleString()}</p>
        `
      );

      toast({
        title: "Correo enviado",
        description: "El correo de prueba ha sido enviado exitosamente.",
      });
    } catch (error) {
      console.error("Error al enviar el correo de prueba:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de prueba. Revisa la consola para más detalles.",
        variant: "destructive"
      });
    }
  };

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

      setMessages((prev) => [...prev, newMessage]);
      
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido publicado exitosamente.",
      });

      // Enviar notificación por email
      await sendEmail(
        "fgavedillo@gmail.com",
        "Nuevo mensaje en el sistema",
        `Se ha recibido un nuevo mensaje: ${text}`
      );
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
        <button
          onClick={testEmail}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Enviar correo de prueba
        </button>
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