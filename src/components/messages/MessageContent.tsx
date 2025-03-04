
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
  
  // Step 2: Convert URLs in text to clickable HTML links with absolute URLs
  const contentWithLinks = linkifyText(decodedContent);
  
  // Step 3: Parse the resulting HTML into React components
  return <>{parse(contentWithLinks)}</>;
};
