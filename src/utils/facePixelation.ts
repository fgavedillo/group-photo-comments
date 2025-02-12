
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter';
import * as faceDetection from '@tensorflow-models/face-detection';

let model: faceDetection.FaceDetector | null = null;

const loadModel = async () => {
  if (!model) {
    // No need to call tf.ready() since we're importing the backends directly
    console.log("TensorFlow backend initialized");

    const detector = faceDetection.SupportedModels.MediaPipeFaceDetector;
    model = await faceDetection.createDetector(detector, {
      runtime: 'tfjs',
      maxFaces: 10, // Aumentado para detectar más caras
      modelType: 'full', // Cambiado a 'full' para mejor precisión
      detectorModelUrl: undefined,
      boundingBox: true,
      keypoints: true,
      attention: true // Mejorar la detección de características faciales
    });
    console.log("Face detection model loaded");
  }
  return model;
};

const pixelateArea = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, pixelSize: number = 15) => {
  try {
    // Asegurarse de que las coordenadas y dimensiones son números enteros
    x = Math.floor(x);
    y = Math.floor(y);
    width = Math.floor(width);
    height = Math.floor(height);

    // Get the pixel data for the area
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    // Loop through each pixel block
    for (let py = 0; py < height; py += pixelSize) {
      for (let px = 0; px < width; px += pixelSize) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        // Get the average color of the pixel block
        for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
            const i = ((py + dy) * width + (px + dx)) * 4;
            if (i < data.length) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              a += data[i + 3];
              count++;
            }
          }
        }
        
        // Calculate average
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        a = Math.round(a / count);
        
        // Apply the average color to the pixel block
        for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
            const i = ((py + dy) * width + (px + dx)) * 4;
            if (i < data.length) {
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
              data[i + 3] = a;
            }
          }
        }
      }
    }
    
    ctx.putImageData(imageData, x, y);
  } catch (error) {
    console.error('Error in pixelateArea:', error);
    throw error;
  }
};

export const pixelateFaces = async (imageFile: File): Promise<Blob> => {
  try {
    console.log("Starting face pixelation process");
    
    // Load the model
    await loadModel();
    if (!model) throw new Error('Failed to load face detection model');
    
    console.log("Model loaded successfully");

    // Create canvas and load image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Load image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });

    console.log("Image loaded, dimensions:", img.width, "x", img.height);

    // Set canvas size to image size
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Convert canvas to tensor for face detection
    console.log("Detecting faces...");
    const faces = await model.estimateFaces(canvas, {
      flipHorizontal: false,
      returnTensors: false,
      predictIrises: false
    });
    console.log("Faces detected:", faces.length);

    // Si no se detectan caras, intentar con diferentes orientaciones
    if (faces.length === 0) {
      console.log("No faces detected, trying with rotated image...");
      const rotations = [90, 180, 270]; // Intentar diferentes rotaciones
      for (const rotation of rotations) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width/2, -img.height/2);
        ctx.restore();
        
        const rotatedFaces = await model.estimateFaces(canvas, {
          flipHorizontal: false,
          returnTensors: false,
          predictIrises: false
        });
        
        if (rotatedFaces.length > 0) {
          console.log(`Found faces after ${rotation}° rotation:`, rotatedFaces.length);
          // Revertir la rotación antes de continuar
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          break;
        }
      }
    }

    // Pixelar cada cara detectada con un padding más grande
    faces.forEach((face, index) => {
      const box = face.box;
      console.log(`Processing face ${index + 1}:`, box);

      const width = box.width;
      const height = box.height;
      
      // Aumentar el padding significativamente para cubrir más área
      const padding = {
        x: width * 0.4, // 40% de padding horizontal
        y: height * 0.4  // 40% de padding vertical
      };
      
      // Asegurarse de que el área a pixelar no se salga del canvas
      const pixelArea = {
        x: Math.max(0, box.xMin - padding.x),
        y: Math.max(0, box.yMin - padding.y),
        width: Math.min(width + padding.x * 2, canvas.width - (box.xMin - padding.x)),
        height: Math.min(height + padding.y * 2, canvas.height - (box.yMin - padding.y))
      };

      // Aumentar el tamaño del pixelado para mayor anonimización
      pixelateArea(
        ctx,
        pixelArea.x,
        pixelArea.y,
        pixelArea.width,
        pixelArea.height,
        20 // Tamaño de pixel más grande para mejor anonimización
      );
    });

    // Si no se detectaron caras, pixelar áreas comunes donde suelen estar los rostros
    if (faces.length === 0) {
      console.log("No faces detected, applying fallback pixelation to common face areas");
      const commonAreas = [
        { x: canvas.width * 0.3, y: canvas.height * 0.2, w: canvas.width * 0.4, h: canvas.height * 0.4 }
      ];
      
      commonAreas.forEach((area, index) => {
        console.log(`Applying fallback pixelation to area ${index + 1}`);
        pixelateArea(
          ctx,
          area.x,
          area.y,
          area.w,
          area.h,
          20
        );
      });
    }

    console.log("Converting processed image to blob");

    // Convert canvas to blob with high quality
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log("Image processing completed successfully");
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/jpeg', 0.95);
    });
  } catch (error) {
    console.error('Error in pixelateFaces:', error);
    throw error;
  }
};
