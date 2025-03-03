
import React from "react";
import { decodeQuotedPrintable, linkifyText } from "@/utils/stringUtils";
import parse from "html-react-parser";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  if (!content) return null;
  
  // Paso 1: Decodificar contenido quoted-printable para eliminar =20 y otros códigos
  const decodedContent = decodeQuotedPrintable(content);
  
  // Paso 2: Convertir URLs en texto a enlaces HTML clickeables con URLs absolutas
  const contentWithLinks = linkifyText(decodedContent);
  
  // Paso 3: Parsear el HTML resultante a componentes React
  return <>{parse(contentWithLinks)}</>;
};
