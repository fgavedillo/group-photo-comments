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
}

export const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/50">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          username={message.username}
          timestamp={message.timestamp}
          message={message.message}
          imageUrl={message.imageUrl}
        />
      ))}
    </div>
  );
};