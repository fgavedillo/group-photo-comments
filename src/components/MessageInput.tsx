
import { useState, useRef, useCallback } from "react";
import { ImagePlus, Send, Loader2 } from "lucide-react";
import { pixelateFaces } from "@/utils/facePixelation";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSend: (message: string, image?: File) => Promise<void>;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      toast({
        title: "Procesando imagen",
        description: "Por favor, espera mientras procesamos la imagen...",
      });

      // Mostrar vista previa inmediata
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Procesar la imagen
      const processedBlob = await pixelateFaces(file);
      const processedFile = new File([processedBlob], file.name, { type: file.type });
      setSelectedImage(processedFile);

      // Actualizar vista previa con imagen procesada
      const processedReader = new FileReader();
      processedReader.onloadend = () => {
        setImagePreview(processedReader.result as string);
        toast({
          title: "Imagen lista",
          description: "La imagen ha sido procesada correctamente",
        });
      };
      processedReader.readAsDataURL(processedBlob);

    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen",
        variant: "destructive",
      });
      setImagePreview(null);
      setSelectedImage(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || isSending) return;

    try {
      setIsSending(true);
      await onSend(message, selectedImage || undefined);
      setMessage("");
      setImagePreview(null);
      setSelectedImage(null);
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje se ha enviado correctamente",
      });
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-100 p-4">
      {imagePreview && (
        <div className="mb-4 relative">
          <img 
            src={imagePreview} 
            alt="Vista previa" 
            className="w-32 h-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 px-4 py-2">
        <button
          type="button"
          onClick={() => !isProcessing && !isSending && fileInputRef.current?.click()}
          disabled={isProcessing || isSending}
          className={`p-2 text-primary hover:text-primary-hover transition-colors ${
            (isProcessing || isSending) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ImagePlus size={20} />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
          disabled={isProcessing || isSending}
        />
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isProcessing ? "Procesando imagen..." : 
            isSending ? "Enviando..." : 
            "Escribe un mensaje..."
          }
          className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none disabled:opacity-50"
          disabled={isProcessing || isSending}
        />
        
        <button
          type="submit"
          disabled={(!message.trim() && !selectedImage) || isProcessing || isSending}
          className="p-2 text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
        >
          {isSending || isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </form>
  );
};
