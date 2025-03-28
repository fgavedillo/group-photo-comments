
import { Message } from "@/types/message";
import { Card } from "../ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { ImageModal } from "../ImageModal";
import { MessageContent } from "./MessageContent";

interface MessageCardProps {
  message: Message;
}

export const MessageCard = ({ message }: MessageCardProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <Card className="p-4 shadow-sm animate-fade-in">
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
          <p className="text-sm text-foreground">
            <MessageContent content={message.message} />
          </p>
          {message.imageUrl && (
            <div className="mt-2">
              <img 
                src={message.imageUrl} 
                alt="Imagen adjunta" 
                className="max-w-[150px] h-auto rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(message.imageUrl)}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
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

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};
