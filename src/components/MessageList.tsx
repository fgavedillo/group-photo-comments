
import { Message } from "@/types/message";
import { ImageModal } from "./ImageModal";
import { useState } from "react";

interface MessageListProps {
  messages: Message[];
  onMessageDelete: (id: string) => void;
}

export const MessageList = ({ messages, onMessageDelete }: MessageListProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="flex-1 p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{message.username}</span>
            <span className="text-sm text-muted-foreground">
              {new Date(message.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">{message.message}</p>
            {message.imageUrl && (
              <div className="mt-2">
                <img 
                  src={message.imageUrl} 
                  alt="Mensaje adjunto" 
                  className="max-w-xs rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(message.imageUrl)}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};
