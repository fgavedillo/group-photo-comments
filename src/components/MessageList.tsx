import { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
  onMessageDelete: (id: string) => void;
}

export const MessageList = ({ messages, onMessageDelete }: MessageListProps) => {
  return (
    <div className="flex-1 p-4 space-y-4">
      {messages.map((message, index) => (
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
              <img 
                src={message.imageUrl} 
                alt="Mensaje adjunto" 
                className="mt-2 max-w-xs rounded-md"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
