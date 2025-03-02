
import { Message } from "@/types/message";
import { ImageModal } from "./ImageModal";
import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

interface MessageListProps {
  messages: Message[];
  onMessageDelete: (id: string) => void;
}

export const MessageList = ({ messages, onMessageDelete }: MessageListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);
  
  // Refs para gestionar el scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isManualScrollingRef = useRef(false);
  
  // Función mejorada para desplazarse al final de los mensajes
  const scrollToBottom = () => {
    // Usar requestAnimationFrame para asegurar que el DOM está actualizado
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        setShowScrollButton(false);
        setNewMessagesCount(0);
      }
    });
  };

  // Auto-scroll inicial cuando se cargan los mensajes por primera vez
  useEffect(() => {
    if (messages.length > 0 && !isManualScrollingRef.current) {
      scrollToBottom();
    }
  }, []);

  // Monitorear los cambios en los mensajes para auto-scroll
  useEffect(() => {
    // Si tenemos nuevos mensajes
    if (messages.length > prevMessagesLength) {
      // Determinar si el usuario está cerca del final
      const container = containerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        // Determinar si estamos al final con una tolerancia de 50px
        const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 50;
        
        if (isNearBottom) {
          // Si está cerca del final, hacer auto-scroll
          scrollToBottom();
        } else {
          // Si no está cerca del final, mostrar indicador de nuevos mensajes
          setNewMessagesCount((prev) => prev + (messages.length - prevMessagesLength));
          setShowScrollButton(true);
        }
      }
    }
    
    // Actualizar la referencia de la longitud de mensajes
    setPrevMessagesLength(messages.length);
  }, [messages, prevMessagesLength]);

  // Manejar el evento de scroll para mostrar/ocultar el botón de scroll
  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) <= 10;
      
      // Marcar que el usuario está scrolleando manualmente
      isManualScrollingRef.current = true;
      
      // Si está cerca del final, ocultar el botón
      if (isNearBottom) {
        setShowScrollButton(false);
        setNewMessagesCount(0);
      } else if (messages.length > 0) {
        // Si no está cerca del final y hay mensajes, mostrar el botón
        setShowScrollButton(true);
      }
      
      // Resetear el estado de scrolling después de un tiempo
      clearTimeout(isManualScrollingRef.current as unknown as number);
      const timeoutId = setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 100);
      
      // Almacenar el ID del timeout
      isManualScrollingRef.current = timeoutId as unknown as boolean;
    }
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
                <span className="font-medium text-primary">{message.username || 'Usuario'}</span>
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
            <p className="text-sm text-foreground">{message.message}</p>
            {message.imageUrl && (
              <div className="mt-2">
                <img 
                  src={message.imageUrl} 
                  alt="Imagen adjunta" 
                  className="max-w-xs rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(message.imageUrl)}
                  onError={(e) => {
                    console.error('Error loading image:', message.imageUrl);
                    e.currentTarget.src = '/placeholder.svg';
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
      
      {/* Elemento invisible para scroll to bottom */}
      <div ref={messagesEndRef} />
      
      {/* Botón para volver al final de los mensajes */}
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
