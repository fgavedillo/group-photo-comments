
/**
 * Utilidad para comprimir imágenes y convertirlas a formato base64
 */

/**
 * Comprime una imagen y la convierte a formato base64
 * @param imageFile Archivo de imagen a comprimir
 * @param maxWidth Ancho máximo de la imagen comprimida (por defecto 800px)
 * @param quality Calidad de la compresión (0-1, por defecto 0.6)
 * @returns Promesa que resuelve a la imagen en formato base64
 */
export const compressImageToBase64 = async (
  imageFile: File | null | undefined,
  maxWidth = 800,
  quality = 0.6
): Promise<string | null> => {
  if (!imageFile) {
    return null;
  }

  try {
    // Leer el archivo como URL de datos
    const originalUrl = await readFileAsDataURL(imageFile);
    if (!originalUrl) return null;

    // Crear una imagen para obtener dimensiones
    const img = await createImageFromUrl(originalUrl);
    
    // Comprimir la imagen usando canvas
    return compressImage(img, maxWidth, quality);
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return null;
  }
};

/**
 * Lee un archivo como URL de datos
 */
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Crea un elemento Image a partir de una URL
 */
const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Comprime una imagen usando canvas
 */
const compressImage = (
  img: HTMLImageElement,
  maxWidth: number,
  quality: number
): string => {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;

  // Calcular nuevas dimensiones manteniendo la proporción
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.floor(height * ratio);
  }

  // Establecer dimensiones del canvas
  canvas.width = width;
  canvas.height = height;

  // Dibujar la imagen en el canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del canvas');
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convertir a base64 con compresión
  const base64 = canvas.toDataURL('image/jpeg', quality);
  
  // Verificar tamaño resultante (opcional)
  const sizeInBytes = approximateBase64Size(base64);
  const sizeInKB = Math.round(sizeInBytes / 1024);
  
  console.log(`Imagen comprimida a ${sizeInKB}KB (${width}x${height})`);
  
  return base64;
};

/**
 * Calcula aproximadamente el tamaño en bytes de una cadena base64
 */
const approximateBase64Size = (base64String: string): number => {
  // Eliminar el prefijo "data:image/jpeg;base64,"
  const base64Data = base64String.split(',')[1];
  if (!base64Data) return 0;
  
  // En base64, 4 caracteres representan 3 bytes
  return Math.floor((base64Data.length * 3) / 4);
};
