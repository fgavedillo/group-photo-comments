
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Issue } from "@/types/issue";

interface IssueFormState {
  status: Issue['status'];
  area: string;
  responsable: string;
  assigned_email: string;
  security_improvement: string;
  action_plan: string;
}

interface IssueFormProps {
  formState: IssueFormState;
  isUpdating: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  onFormStateChange: (field: keyof IssueFormState, value: string) => void;
  onCancel: () => void;
}

export const IssueForm = ({ 
  formState,
  isUpdating,
  onFormSubmit,
  onFormStateChange,
  onCancel
}: IssueFormProps) => {
  return (
    <form onSubmit={onFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={formState.status}
          onValueChange={(value) => onFormStateChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="en-estudio">En estudio</SelectItem>
            <SelectItem value="en-curso">En curso</SelectItem>
            <SelectItem value="cerrada">Cerrada</SelectItem>
            <SelectItem value="denegado">Denegado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Área</Label>
        <Input
          type="text"
          value={formState.area}
          onChange={(e) => onFormStateChange('area', e.target.value)}
          placeholder="Ingrese el área"
        />
      </div>

      <div className="space-y-2">
        <Label>Responsable</Label>
        <Input
          type="text"
          value={formState.responsable}
          onChange={(e) => onFormStateChange('responsable', e.target.value)}
          placeholder="Nombre del responsable"
        />
      </div>

      <div className="space-y-2">
        <Label>Email asignado</Label>
        <Input
          type="email"
          value={formState.assigned_email}
          onChange={(e) => onFormStateChange('assigned_email', e.target.value)}
          placeholder="ejemplo@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Mejora de seguridad</Label>
        <Textarea
          value={formState.security_improvement}
          onChange={(e) => onFormStateChange('security_improvement', e.target.value)}
          placeholder="Describe la mejora de seguridad..."
          className="min-h-[100px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label>Plan de acción</Label>
        <Textarea
          value={formState.action_plan}
          onChange={(e) => onFormStateChange('action_plan', e.target.value)}
          placeholder="Describe el plan de acción..."
          className="min-h-[100px] resize-y"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isUpdating} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isUpdating ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
};
