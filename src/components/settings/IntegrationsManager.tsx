
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isConfigured: boolean;
}

export const IntegrationsManager = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'email',
      name: 'Email',
      description: 'Configurar el envío de emails desde la aplicación',
      isActive: true,
      isConfigured: true
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Integración con canales de Slack para notificaciones',
      isActive: false,
      isConfigured: false
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Conectar con Microsoft Teams para colaboración',
      isActive: false,
      isConfigured: false
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Sincronización con Google Calendar',
      isActive: false,
      isConfigured: false
    }
  ]);
  const { toast } = useToast();

  const handleToggle = (id: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, isActive: !integration.isActive }
          : integration
      )
    );
    
    const integration = integrations.find(int => int.id === id);
    
    toast({
      title: integration?.isActive ? "Integración desactivada" : "Integración activada",
      description: `La integración con ${integration?.name} ha sido ${integration?.isActive ? 'desactivada' : 'activada'}`
    });
  };

  const handleConfigure = (id: string) => {
    const integration = integrations.find(int => int.id === id);
    
    // Aquí iría la lógica para abrir el modal de configuración
    
    toast({
      title: "Configuración",
      description: `Configurando integración con ${integration?.name}`
    });
  };

  return (
    <div className="space-y-4">
      {integrations.map(integration => (
        <Card key={integration.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{integration.name}</h3>
                  {integration.isConfigured ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Configurado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      No configurado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleConfigure(integration.id)}
                >
                  Configurar
                </Button>
                <Switch
                  checked={integration.isActive}
                  onCheckedChange={() => handleToggle(integration.id)}
                  disabled={!integration.isConfigured}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
