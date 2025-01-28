import { useState } from "react";
import { MessageInput } from "@/components/MessageInput";
import { MessageList, type Message } from "@/components/MessageList";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const handleSendMessage = async (text: string, image?: File) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      username: "Usuario", // En una versión futura esto vendría de la autenticación
      timestamp: new Date(),
      message: text,
    };

    if (image) {
      // En una versión futura, esto subiría la imagen a un servidor
      newMessage.imageUrl = URL.createObjectURL(image);
    }

    setMessages((prev) => [...prev, newMessage]);
    
    toast({
      title: "Mensaje enviado",
      description: "Tu mensaje ha sido publicado exitosamente.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-semibold text-center text-foreground">
          Chat Grupal
        </h1>
      </header>

      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};

export default Index;