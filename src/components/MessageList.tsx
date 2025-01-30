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
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-whatsapp-bg bg-whatsapp-pattern bg-repeat">
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
    </div>
  );
};