import { IssueManagement } from "@/components/IssueManagement";
import { useIssues } from "@/hooks/useIssues";

const Issues = () => {
  const { issues } = useIssues();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gestión de Incidencias</h1>
      <IssueManagement messages={issues} />
    </div>
  );
};

export default Issues;