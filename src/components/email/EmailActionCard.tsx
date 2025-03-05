
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, UserCheck, SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailActionCardProps {
  title: string;
  description: string;
  content: string;
  buttonText: string;
  isLoading: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  highlight?: boolean;
  onClick: () => void;
}

export const EmailActionCard = ({
  title,
  description,
  content,
  buttonText,
  isLoading,
  variant = "default",
  highlight = false,
  onClick
}: EmailActionCardProps) => {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-md",
      highlight && "border-blue-200 bg-blue-50/30"
    )}>
      <CardHeader className={cn(
        "pb-2",
        highlight && "border-b border-blue-100"
      )}>
        <CardTitle className="flex items-center gap-2">
          {highlight ? (
            <UserCheck className="h-5 w-5 text-blue-500" />
          ) : (
            <Mail className="h-5 w-5 text-muted-foreground" />
          )}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{content}</p>
        <Button 
          onClick={onClick} 
          disabled={isLoading}
          className={cn(
            "w-full transition-all",
            highlight && !isLoading && variant === "secondary" && "bg-blue-600 hover:bg-blue-700 text-white"
          )}
          variant={variant}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              {highlight ? (
                <UserCheck className="mr-2 h-4 w-4" />
              ) : (
                <SendHorizonal className="mr-2 h-4 w-4" />
              )}
              {buttonText}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
