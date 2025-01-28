import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Issue {
  id: string;
  imageUrl: string;
  timestamp: Date;
  username: string;
  description: string;
  actionPlan?: string;
  status: "pending" | "in-progress" | "resolved";
  comments: string[];
}

export const IssueManagement = ({ messages }: { messages: any[] }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newComment, setNewComment] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const { toast } = useToast();

  const handleAddActionPlan = (issueId: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, actionPlan, status: "in-progress" as const };
      }
      return issue;
    }));
    toast({
      title: "Plan de acción actualizado",
      description: "Se ha guardado el plan de acción correctamente."
    });
  };

  const handleAddComment = (issueId: string) => {
    if (!newComment.trim()) return;
    
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        return { ...issue, comments: [...issue.comments, newComment] };
      }
      return issue;
    }));
    setNewComment("");
    toast({
      title: "Comentario añadido",
      description: "Se ha añadido el comentario correctamente."
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {messages.filter(m => m.imageUrl).map((message) => (
          <Card key={message.id} className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Incidencia #{message.id}</CardTitle>
              <CardDescription>
                Reportada por {message.username} el {message.timestamp.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={message.imageUrl} 
                alt="Incidencia"
                className="w-full h-48 object-cover rounded-md"
              />
              <p className="text-sm text-muted-foreground">{message.message}</p>
              
              <div className="space-y-2">
                <h4 className="font-medium">Plan de Acción</h4>
                <Textarea
                  placeholder="Describe el plan de acción..."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                />
                <Button 
                  onClick={() => handleAddActionPlan(message.id)}
                  className="w-full"
                >
                  Guardar Plan
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Comentarios</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Añade un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleAddComment(message.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Añadir Comentario
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};