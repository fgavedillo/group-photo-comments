import { useEffect, useRef } from "react";
import { Canvas, Image as FabricImage } from "fabric";
import { Button } from "./ui/button";

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

export const ImageCropper = ({ imageUrl, onCrop, onCancel }: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 500,
      height: 400,
    });
    fabricRef.current = canvas;

    // Load the image
    FabricImage.fromURL(
      imageUrl,
      (img) => {
        // Scale image to fit canvas while maintaining aspect ratio
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        ) * 0.8;

        img.scale(scale);
        img.set({
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
        });

        canvas.add(img);
        canvas.renderAll();
      }
    );

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  const handleCrop = () => {
    if (!fabricRef.current) return;

    // Get the canvas data as JPEG with proper options
    const croppedDataUrl = fabricRef.current.toDataURL({
      format: 'jpeg',
      quality: 0.8,
      multiplier: 1,
      enableRetinaScaling: false
    });

    onCrop(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Recortar imagen</h3>
        <canvas ref={canvasRef} className="border border-gray-200 mb-4" />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCrop}>
            Recortar y Enviar
          </Button>
        </div>
      </div>
    </div>
  );
};