
const CompanySettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Información Básica */}
      <Section title="Información de la Empresa">
        <CompanyInfoForm />
      </Section>

      {/* Personalización */}
      <Section title="Personalización">
        <BrandingSettings />
      </Section>

      {/* Notificaciones */}
      <Section title="Configuración de Notificaciones">
        <NotificationSettings />
      </Section>

      {/* Integraciones */}
      <Section title="Integraciones">
        <IntegrationsManager />
      </Section>
    </div>
  );
}; 

export default CompanySettings;
