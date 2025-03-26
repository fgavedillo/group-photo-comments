
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    dailyReports: true,
    weeklyReports: false,
    userActivity: true,
    securityAlerts: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = (name: string) => {
    setSettings(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Aquí iría la lógica para guardar la configuración
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de notificaciones ha sido actualizada"
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Notificaciones por email</Label>
            <p className="text-sm text-muted-foreground">
              Recibir notificaciones de incidencias por email
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={() => handleToggle('emailNotifications')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dailyReports">Informes diarios</Label>
            <p className="text-sm text-muted-foreground">
              Recibir un resumen diario de actividad
            </p>
          </div>
          <Switch
            id="dailyReports"
            checked={settings.dailyReports}
            onCheckedChange={() => handleToggle('dailyReports')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weeklyReports">Informes semanales</Label>
            <p className="text-sm text-muted-foreground">
              Recibir un resumen semanal más detallado
            </p>
          </div>
          <Switch
            id="weeklyReports"
            checked={settings.weeklyReports}
            onCheckedChange={() => handleToggle('weeklyReports')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="userActivity">Actividad de usuarios</Label>
            <p className="text-sm text-muted-foreground">
              Notificaciones sobre actividad de usuarios
            </p>
          </div>
          <Switch
            id="userActivity"
            checked={settings.userActivity}
            onCheckedChange={() => handleToggle('userActivity')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="securityAlerts">Alertas de seguridad</Label>
            <p className="text-sm text-muted-foreground">
              Notificaciones sobre eventos de seguridad importantes
            </p>
          </div>
          <Switch
            id="securityAlerts"
            checked={settings.securityAlerts}
            onCheckedChange={() => handleToggle('securityAlerts')}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar configuración"}
      </Button>
    </form>
  );
};
