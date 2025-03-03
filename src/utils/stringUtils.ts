
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
  
  // Eliminar cualquier residuo de '=20' o similares
  decoded = decoded.replace(/=20/g, ' ');
  
  // Corregir URLs que podrían estar mal formadas
  decoded = decoded.replace(/(https?:\/\/[^\s]*)(=20)([^\s]*)/gi, '$1$3');
  
  return decoded;
};

/**
 * Detecta y convierte URLs en texto plano a enlaces HTML clickeables
 */
export const linkifyText = (text: string): string => {
  if (!text) return '';
  
  // Expresión regular mejorada para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Reemplazar URLs con enlaces HTML, y limpiar posibles caracteres =20
  return text.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/=20/g, '');
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${cleanUrl}</a>`;
  });
};
