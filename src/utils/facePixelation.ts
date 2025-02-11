
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

let model: faceDetection.FaceDetector | null = null;

const loadModel = async () => {
  if (!model) {
    // Ensure TensorFlow backend is initialized
    await tf.ready();
    console.log("TensorFlow backend initialized");

    const detector = faceDetection.SupportedModels.MediaPipeFaceDetector;
    model = await faceDetection.createDetector(detector, {
      runtime: 'tfjs',
      maxFaces: 5,
      modelType: 'short'
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
    const faces = await model.detectFaces(canvas);
    console.log("Faces detected:", faces.length);

    // Pixelate each detected face
    faces.forEach((face, index) => {
      const box = face.box;
      console.log(`Processing face ${index + 1}:`, box);

      const width = box.width;
      const height = box.height;
      
      // Add some padding around the face
      const padding = { x: width * 0.2, y: height * 0.2 };
      
      pixelateArea(
        ctx,
        Math.max(0, box.xMin - padding.x),
        Math.max(0, box.yMin - padding.y),
        Math.min(width + padding.x * 2, canvas.width - box.xMin),
        Math.min(height + padding.y * 2, canvas.height - box.yMin),
        15
      );
    });

    // If no faces were detected, log it
    if (faces.length === 0) {
      console.log("No faces detected in the image");
    }

    console.log("Converting processed image to blob");

    // Convert canvas to blob
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
