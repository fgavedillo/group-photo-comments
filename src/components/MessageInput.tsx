
import { useState, useRef, useCallback } from "react";
import { ImagePlus, Send } from "lucide-react";
import { pixelateFaces } from "@/utils/facePixelation";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSend: (message: string, image?: File) => void;
  className?: string;
}

export const MessageInput = ({ onSend, className = "" }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessing(true);
        toast({
          title: "Procesando imagen",
          description: "Detectando rostros...",
        });

        // Primero mostramos la imagen original como preview temporal
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Procesar la imagen para pixelar rostros
        console.log("Starting face detection process");
        const processedBlob = await pixelateFaces(file);
        console.log("Face detection completed");

        const processedFile = new File([processedBlob], file.name, { type: file.type });
        setSelectedImage(processedFile);
        
        // Actualizar preview con la imagen procesada
        const processedReader = new FileReader();
        processedReader.onloadend = () => {
          setImagePreview(processedReader.result as string);
          toast({
            title: "Imagen procesada",
            description: "La imagen ha sido procesada exitosamente.",
          });
        };
        processedReader.readAsDataURL(processedBlob);

      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar la imagen. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  }, [toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedImage) {
      onSend(message, selectedImage || undefined);
      setMessage("");
      setImagePreview(null);
      setSelectedImage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-4 ${className}`}>
      <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 px-4 py-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 text-primary hover:text-primary-hover transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isProcessing ? "Procesando imagen..." : "Añadir imagen"}
          disabled={isProcessing}
        >
          <ImagePlus size={20} />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
          disabled={isProcessing}
        />
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isProcessing ? "Procesando imagen..." : "Escribe un mensaje..."}
          className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none"
          disabled={isProcessing}
        />
        
        <button
          type="submit"
          disabled={(!message.trim() && !selectedImage) || isProcessing}
          className="p-2 text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
          title="Enviar mensaje"
        >
          <Send size={20} />
        </button>
      </div>
      
      {imagePreview && (
        <div className="mt-2 relative">
          <img 
            src={imagePreview} 
            alt="Vista previa" 
            className="w-20 h-20 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setSelectedImage(null);
            }}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
            style={{ width: "18px", height: "18px", fontSize: "12px", lineHeight: "10px" }}
          >
            ×
          </button>
        </div>
      )}
    </form>
  );
};
