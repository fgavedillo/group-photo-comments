
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";

interface ScrollButtonProps {
  onClick: () => void;
  newMessagesCount: number;
}

export const ScrollButton = ({ onClick, newMessagesCount }: ScrollButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 rounded-full shadow-lg animate-bounce z-50 flex items-center gap-1 p-2"
      size="sm"
      variant="secondary"
    >
      <ChevronDown className="h-4 w-4" />
      {newMessagesCount > 0 && (
        <span className="text-xs font-semibold bg-primary text-white rounded-full px-1.5 py-0.5 ml-1">
          {newMessagesCount}
        </span>
      )}
    </Button>
  );
};
