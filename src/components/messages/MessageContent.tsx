
import React from "react";
import { decodeQuotedPrintable } from "@/utils/stringUtils";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  if (!content) return null;
  
  // Get a fully cleaned version of the content
  const decodedContent = decodeQuotedPrintable(content);
  
  // Define URL regex pattern for detecting links - improved to better capture domains
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Extract all parts of the text (including URLs and non-URL text)
  const parts = decodedContent.split(urlRegex);
  
  // Extract all URLs from the content
  const urls: string[] = decodedContent.match(urlRegex) || [];
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if the current part is a URL
        const isUrl = urls.includes(part);
        
        if (isUrl) {
          // Fix URLs that might have encoding issues
          const cleanUrl = part.replace(/=20/g, '');
          return (
            <a 
              key={index} 
              href={cleanUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {part.replace(/=20/g, '')}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};
