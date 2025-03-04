
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";

interface EmailActionCardProps {
  title: string;
  description: string;
  content: string;
  buttonText: string;
  isLoading: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  onClick: () => void;
}

export const EmailActionCard = ({
  title,
  description,
  content,
  buttonText,
  isLoading,
  variant = "default",
  onClick
}: EmailActionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{content}</p>
        <Button 
          onClick={onClick} 
          disabled={isLoading}
          className="w-full sm:w-auto"
          variant={variant}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
