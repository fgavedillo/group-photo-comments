
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CompanySettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configuración de información básica de la empresa</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalización</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Personalización de la apariencia</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Gestione las notificaciones del sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Conecte con otros servicios</p>
        </CardContent>
      </Card>
    </div>
  );
}; 

export default CompanySettings;
