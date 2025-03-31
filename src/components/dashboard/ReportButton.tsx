
// Componente simplificado que ya no utiliza funcionalidad de envío de email
const ReportButton = ({ dashboardRef, issuesTableRef }: { 
  dashboardRef: React.RefObject<HTMLDivElement>;
  issuesTableRef?: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div>
      {/* La funcionalidad de envío de correos ha sido eliminada */}
    </div>
  );
};

export { ReportButton };
