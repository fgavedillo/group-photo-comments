import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal = ({ imageUrl, isOpen, onClose }: ImageModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 flex items-center justify-center">
        <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Imagen ampliada"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};