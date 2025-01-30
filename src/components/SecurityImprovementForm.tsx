import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SecurityImprovementFormProps {
  securityImprovement: string;
  actionPlan: string;
  onSecurityImprovementChange: (value: string) => void;
  onActionPlanChange: (value: string) => void;
  onSave: () => void;
}

export const SecurityImprovementForm = ({
  securityImprovement,
  actionPlan,
  onSecurityImprovementChange,
  onActionPlanChange,
  onSave
}: SecurityImprovementFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">Situación a Mejorar en Seguridad</h4>
        <Textarea
          placeholder="Describe la situación a mejorar..."
          value={securityImprovement}
          onChange={(e) => onSecurityImprovementChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Plan de Acción</h4>
        <Textarea
          placeholder="Describe el plan de acción..."
          value={actionPlan}
          onChange={(e) => onActionPlanChange(e.target.value)}
        />
      </div>

      <Button onClick={onSave} className="w-full">
        Guardar Cambios
      </Button>
    </div>
  );
};