import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter';
import * as faceDetection from '@tensorflow-models/face-detection';

let model: faceDetection.FaceDetector | null = null;

const loadModel = async () => {
  if (!model) {
    console.log("TensorFlow backend initialized");

    const detector = faceDetection.SupportedModels.MediaPipeFaceDetector;
    model = await faceDetection.createDetector(detector, {
      runtime: 'tfjs',
      maxFaces: 10, // Aumentado para detectar más caras
      modelType: 'full', // Cambiado a 'full' para mejor precisión
    });
    console.log("Face detection model loaded");
  }
  return model;
};

const pixelateArea = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, pixelSize: number = 15) => {
  try {
    x = Math.floor(x);
    y = Math.floor(y);
    width = Math.floor(width);
    height = Math.floor(height);

    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    for (let py = 0; py < height; py += pixelSize) {
      for (let px = 0; px < width; px += pixelSize) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
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
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        a = Math.round(a / count);
        
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
    
    await loadModel();
    if (!model) throw new Error('Failed to load face detection model');
    
    console.log("Model loaded successfully");

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });

    console.log("Image loaded, dimensions:", img.width, "x", img.height);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    console.log("Detecting faces...");
    const faces = await model.estimateFaces(canvas, {
      flipHorizontal: false,
    });
    console.log("Faces detected:", faces.length);

    if (faces.length === 0) {
      console.log("No faces detected, trying with rotated image...");
      const rotations = [90, 180, 270];
      for (const rotation of rotations) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width/2, -img.height/2);
        ctx.restore();
        
        const rotatedFaces = await model.estimateFaces(canvas, {
          flipHorizontal: false,
        });
        
        if (rotatedFaces.length > 0) {
          console.log(`Found faces after ${rotation}° rotation:`, rotatedFaces.length);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          break;
        }
      }
    }

    faces.forEach((face, index) => {
      const box = face.box;
      console.log(`Processing face ${index + 1}:`, box);

      const width = box.width;
      const height = box.height;
      
      const padding = {
        x: width * 0.5,
        y: height * 0.5
      };
      
      const pixelArea = {
        x: Math.max(0, box.xMin - padding.x),
        y: Math.max(0, box.yMin - padding.y),
        width: Math.min(width + padding.x * 2, canvas.width - (box.xMin - padding.x)),
        height: Math.min(height + padding.y * 2, canvas.height - (box.yMin - padding.y))
      };

      pixelateArea(
        ctx,
        pixelArea.x,
        pixelArea.y,
        pixelArea.width,
        pixelArea.height,
        25
      );
    });

    if (faces.length === 0) {
      console.log("No faces detected, applying fallback pixelation to common face areas");
      const commonAreas = [
        { x: canvas.width * 0.2, y: canvas.height * 0.1, w: canvas.width * 0.6, h: canvas.height * 0.6 }
      ];
      
      commonAreas.forEach((area, index) => {
        console.log(`Applying fallback pixelation to area ${index + 1}`);
        pixelateArea(
          ctx,
          area.x,
          area.y,
          area.w,
          area.h,
          25
        );
      });
    }

    console.log("Converting processed image to blob");

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
