
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/lib/supabase';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export const RolesManager = () => {
  const [roles, setRoles] = useState<Role[]>([
    { id: 'admin', name: 'Administrador', permissions: ['all'] },
    { id: 'user', name: 'Usuario', permissions: ['read', 'write'] },
    { id: 'viewer', name: 'Visor', permissions: ['read'] }
  ]);
  const [newRoleName, setNewRoleName] = useState('');
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  // En una implementación real, cargaríamos los roles desde la base de datos
  // Esta es una implementación básica para mostrar la UI
  
  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rol no puede estar vacío",
        variant: "destructive"
      });
      return;
    }
    
    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName,
      permissions: ['read']
    };
    
    setRoles([...roles, newRole]);
    setNewRoleName('');
    
    toast({
      title: "Rol creado",
      description: `El rol "${newRoleName}" ha sido creado exitosamente`
    });
  };
  
  const handleDeleteRole = (roleId: string) => {
    // No permitir eliminar roles básicos
    if (['admin', 'user', 'viewer'].includes(roleId)) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminar roles predeterminados del sistema",
        variant: "destructive"
      });
      return;
    }
    
    setRoles(roles.filter(role => role.id !== roleId));
    toast({
      title: "Rol eliminado",
      description: "El rol ha sido eliminado exitosamente"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md font-medium">
            Crear nuevo rol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Nombre del rol"
              className="flex-1"
            />
            <Button onClick={handleAddRole}>
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(role => (
          <Card key={role.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{role.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {role.permissions.join(', ')}
                  </p>
                </div>
                {!['admin', 'user', 'viewer'].includes(role.id) && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
