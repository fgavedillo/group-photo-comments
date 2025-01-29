import { useState, useRef } from "react";
import { ImagePlus, Send } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string, image?: File) => void;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
            onClick={() => {
              setImagePreview(null);
              setSelectedImage(null);
            }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
          title="Añadir imagen"
        >
          <ImagePlus size={20} />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-2 rounded-full bg-secondary text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        
        <button
          type="submit"
          disabled={!message.trim() && !selectedImage}
          className="p-2 text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
          title="Enviar mensaje"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};