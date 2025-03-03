
/**
 * Decodifica texto en formato quoted-printable, eliminando caracteres como =20
 * que suelen aparecer en correos electrónicos
 */
export const decodeQuotedPrintable = (text: string): string => {
  if (!text) return '';
  
  // Reemplazar caracteres codificados comunes como =20 (espacio)
  let decoded = text.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch (e) {
      return match;
    }
  });
  
  // Reemplazar saltos de línea codificados
  decoded = decoded.replace(/=\r\n/g, '');
  
  // Reemplazar otros caracteres problemáticos comunes en emails
  decoded = decoded.replace(/&nbsp;/g, ' ');
  
  return decoded;
};

/**
 * Detecta y convierte URLs en texto plano a enlaces HTML clickeables
 */
export const linkifyText = (text: string): string => {
  if (!text) return '';
  
  // Expresión regular para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Reemplazar URLs con enlaces HTML
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
};
