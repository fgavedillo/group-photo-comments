
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
  decoded = decoded.replace(/=\n/g, '');
  
  // Eliminar completamente los caracteres '=20' que suelen aparecer al final de líneas
  decoded = decoded.replace(/=20/g, ' ');
  
  // Reemplazar otros caracteres problemáticos comunes en emails
  decoded = decoded.replace(/&nbsp;/g, ' ');
  
  return decoded;
};

/**
 * Detecta y convierte URLs en texto plano a enlaces HTML clickeables
 * utilizando URLs absolutas con el dominio correcto
 */
export const linkifyText = (text: string): string => {
  if (!text) return '';
  
  // Obtener el dominio base desde la ventana del navegador
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Expresión regular para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Reemplazar URLs con enlaces HTML
  const linkedText = text.replace(urlRegex, (url) => {
    // Si la URL contiene incidencias.lingotes.com, reemplazarla con la URL correcta
    let correctedUrl = url;
    if (url.includes('incidencias.lingotes.com')) {
      correctedUrl = url.replace('incidencias.lingotes.com', baseDomain.replace(/^https?:\/\//, ''));
    }
    
    return `<a href="${correctedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
  });
  
  return linkedText;
};

/**
 * Crea una URL absoluta basada en la ruta actual
 */
export const getAbsoluteUrl = (path: string): string => {
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';
  // Asegurarse de que la ruta comience con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseDomain}${normalizedPath}`;
};
