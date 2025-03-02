
import { Message } from "@/types/message";
import { ImageModal } from "./ImageModal";
import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { decodeQuotedPrintable, linkifyText } from "@/utils/stringUtils";

interface MessageListProps {
  messages: Message[];
  onMessageDelete: (id: string) => void;
}

export const MessageList = ({ messages, onMessageDelete }: MessageListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isManualScrollingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          setShowScrollButton(false);
          setNewMessagesCount(0);
        }
      });
    });
  };

  useEffect(() => {
    if (messages.length > 0 && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > prevMessagesLength) {
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 20;
        
        if (isNearBottom && !isManualScrollingRef.current) {
          scrollToBottom();
        } else {
          setNewMessagesCount((prev) => prev + (messages.length - prevMessagesLength));
          setShowScrollButton(true);
        }
      }
    }
    
    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 5;
      
      isManualScrollingRef.current = true;
      
      if (isNearBottom) {
        setShowScrollButton(false);
        setNewMessagesCount(0);
      } else if (messages.length > 0) {
        setShowScrollButton(true);
      }
      
      clearTimeout(isManualScrollingRef.current as unknown as number);
      const timeoutId = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 100);
      
      isManualScrollingRef.current = timeoutId as unknown as boolean;
    }
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    
    const decodedContent = decodeQuotedPrintable(content);
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    const parts = decodedContent.split(urlRegex);
    
    const urls = decodedContent.match(urlRegex) || [];
    
    return (
      <>
        {parts.map((part, index) => {
          if (urls.includes(part)) {
            return (
              <a 
                key={index} 
                href={part} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {part}
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 p-4 space-y-4 overflow-y-auto relative" 
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <Card key={message.id} className="p-4 shadow-sm animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary">
                  {message.username || 
                   ((message.firstName || message.lastName) ? 
                    `${message.firstName || ''} ${message.lastName || ''}`.trim() : 'Usuario')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(message.timestamp), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </span>
              </div>
              <span className={`text-sm px-2 py-1 rounded-full ${
                message.status === 'en-estudio' ? 'bg-yellow-100 text-yellow-800' :
                message.status === 'en-curso' ? 'bg-blue-100 text-blue-800' :
                message.status === 'cerrada' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {message.status}
              </span>
            </div>
            <p className="text-sm text-foreground">{renderMessageContent(message.message)}</p>
            {message.imageUrl && (
              <div className="mt-2">
                <img 
                  src={message.imageUrl} 
                  alt="Imagen adjunta" 
                  className="max-w-xs rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(message.imageUrl)}
                  onError={(e) => {
                    console.error('Error loading image:', message.imageUrl);
                    (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
            )}
            {message.area && (
              <div className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">Área:</span> {message.area}
              </div>
            )}
            {message.responsable && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Responsable:</span> {message.responsable}
              </div>
            )}
          </div>
        </Card>
      ))}
      
      <div ref={messagesEndRef} />
      
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-6 rounded-full shadow-lg animate-bounce z-50 flex items-center gap-1 p-2"
          size="sm"
          variant="secondary"
        >
          <ChevronDown className="h-4 w-4" />
          {newMessagesCount > 0 && (
            <span className="text-xs font-semibold bg-primary text-white rounded-full px-1.5 py-0.5 ml-1">
              {newMessagesCount}
            </span>
          )}
        </Button>
      )}

      <ImageModal
        imageUrl={selectedImage || ''}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};
