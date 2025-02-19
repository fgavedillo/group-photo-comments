
import { Auth } from "@/components/Auth";
import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessages } from "@/hooks/useMessages";
import { useMessageSender } from "@/hooks/useMessageSender";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { messages, loadMessages } = useMessages();
  const { handleSendMessage } = useMessageSender(loadMessages);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white shadow-sm">
      <header className="bg-white border-b border-gray-100 p-2 sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-foreground">
          Sistema de Gestión de Incidencias
        </h1>
      </header>

      <Tabs defaultValue="chat" className="flex-1">
        <div className="sticky top-[3.5rem] bg-white z-40 border-b">
          <TabsList className="w-full h-auto justify-start rounded-none gap-2 px-2">
            <TabsTrigger value="chat">
              Chat
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="h-full m-0 data-[state=active]:flex flex-col">
          <div className="flex-1 overflow-auto">
            <MessageList messages={messages} onMessageDelete={loadMessages} />
          </div>
          <MessageInput onSend={handleSendMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Landing;
