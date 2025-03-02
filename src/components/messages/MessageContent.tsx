
import React from "react";
import { decodeQuotedPrintable } from "@/utils/stringUtils";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
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
