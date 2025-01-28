import { format } from "date-fns";

interface MessageBubbleProps {
  username: string;
  timestamp: Date;
  message: string;
  imageUrl?: string;
}

export const MessageBubble = ({ username, timestamp, message, imageUrl }: MessageBubbleProps) => {
  return (
    <div className="message-bubble animate-message-appear">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-primary">{username}</h3>
        <span className="text-xs text-muted-foreground">
          {format(timestamp, "dd MMM yyyy, HH:mm")}
        </span>
      </div>
      
      {imageUrl && (
        <div className="mb-3 animate-image-appear">
          <img 
            src={imageUrl} 
            alt={`Shared by ${username}`}
            className="message-image"
            loading="lazy"
          />
        </div>
      )}
      
      <p className="text-sm leading-relaxed text-foreground">{message}</p>
    </div>
  );
};