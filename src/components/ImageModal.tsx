import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal = ({ imageUrl, isOpen, onClose }: ImageModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
        <img
          src={imageUrl}
          alt="Imagen ampliada"
          className="w-full h-full object-contain"
          onClick={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};