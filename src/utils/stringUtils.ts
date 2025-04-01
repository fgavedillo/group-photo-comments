/**
 * Utilidades para el procesamiento de texto y URLs
 */

/**
 * Decodifica texto en formato quoted-printable, eliminando caracteres especiales
 * que comúnmente aparecen en textos codificados para transmisión
 * 
 * @param text - El texto codificado a decodificar
 * @returns El texto decodificado y limpio
 */
export const decodeQuotedPrintable = (text: string): string => {
  if (!text) return '';
  
  // Reemplaza caracteres codificados como =20 (espacio)
  let decoded = text.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch (e) {
      return '';
    }
  });
  
  // Reemplaza saltos de línea codificados
  decoded = decoded.replace(/=\r\n/g, '');
  decoded = decoded.replace(/=\n/g, '');
  
  // Elimina completamente todas las instancias de caracteres =20 y cualquier = seguido de espacios
  decoded = decoded.replace(/=20+/g, ' ');
  decoded = decoded.replace(/=\s*/g, '');
  
  // Reemplaza otros caracteres problemáticos comunes en textos codificados
  decoded = decoded.replace(/&nbsp;/g, ' ');
  decoded = decoded.replace(/null/g, '');
  decoded = decoded.replace(/undefined/g, '');
  
  // Limpia el exceso de espacios en blanco
  decoded = decoded.replace(/\s+/g, ' ').trim();
  
  return decoded;
};

/**
 * Detecta y convierte URLs en texto plano a enlaces HTML clicables
 * usando URLs absolutas con el dominio correcto
 * 
 * @param text - El texto que puede contener URLs
 * @returns Texto HTML con enlaces clicables
 */
export const linkifyText = (text: string): string => {
  if (!text) return '';
  
  // Obtiene el dominio base del navegador
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Expresión regular para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Reemplaza URLs con enlaces HTML
  const linkedText = text.replace(urlRegex, (url) => {
    // Si la URL contiene un dominio específico, lo reemplaza con el correcto
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
 * 
 * @param path - La ruta relativa
 * @returns URL absoluta incluyendo el dominio
 */
export const getAbsoluteUrl = (path: string): string => {
  const baseDomain = typeof window !== 'undefined' ? window.location.origin : '';
  // Asegura que la ruta comience con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseDomain}${normalizedPath}`;
};
