
import { useEffect, useRef, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";

export interface Message {
  id: string;
  username: string;
  timestamp: Date;
  message: string;
  imageUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  onMessageDelete: () => void;
}

export const MessageList = ({ messages, onMessageDelete }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Scroll al último mensaje cuando cambian los mensajes
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Scroll inmediato al último mensaje al montar el componente
    const initialScroll = () => {
      messagesEndRef.current?.scrollIntoView();
    };
    
    // Usar un pequeño timeout para asegurar que el DOM está listo
    const timeoutId = setTimeout(initialScroll, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          id={message.id}
          username={message.username}
          timestamp={message.timestamp}
          message={message.message}
          imageUrl={message.imageUrl}
          onDelete={onMessageDelete}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
