
import React from "react";
import { decodeQuotedPrintable, linkifyText } from "@/utils/stringUtils";
import parse from "html-react-parser";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  if (!content) return null;
  
  // Step 1: Decode quoted-printable content to remove =20 and other codes
  const decodedContent = decodeQuotedPrintable(content);
  
  // Step 2: Clean up any remaining =20 codes and normalize spaces
  const cleanedContent = decodedContent
    .replace(/=20+/g, '') // Remove all =20 codes completely
    .replace(/=\s*/g, '') // Remove any other = followed by whitespace
    .replace(/\s+/g, ' ') // Normalize spaces (multiple spaces to single space)
    .trim();
  
  // Step 3: Convert URLs in text to clickable HTML links with absolute URLs
  const contentWithLinks = linkifyText(cleanedContent);
  
  // Step 4: Parse the resulting HTML into React components
  return (
    <div className="message-content">
      {parse(contentWithLinks)}
    </div>
  );
};
