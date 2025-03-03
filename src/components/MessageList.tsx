
import { Message } from "@/types/message";
import { useState } from "react";
import { MessageCard } from "./messages/MessageCard";
import { ScrollButton } from "./messages/ScrollButton";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { ImageModal } from "./ImageModal";

interface MessageListProps {
  messages: Message[];
  onMessageDelete: (id: string) => void;
}

export const MessageList = ({ messages, onMessageDelete }: MessageListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const {
    containerRef,
    messagesEndRef,
    showScrollButton,
    newMessagesCount,
    scrollToBottom,
    handleScroll
  } = useScrollToBottom({ messages });

  // Ordenar los mensajes para mostrar los más recientes primero
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div 
      ref={containerRef} 
      className="flex-1 p-4 space-y-4 overflow-y-auto relative" 
      onScroll={handleScroll}
    >
      {sortedMessages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
      
      <div ref={messagesEndRef} />
      
      {showScrollButton && (
        <ScrollButton 
          onClick={scrollToBottom} 
          newMessagesCount={newMessagesCount} 
        />
      )}

      <ImageModal
        imageUrl={selectedImage || ''}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};
