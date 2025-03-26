
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from '@/contexts/CompanyContext';

interface Department {
  id: string;
  name: string;
  userCount: number;
}

export const DepartmentsManager = () => {
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Desarrollo', userCount: 5 },
    { id: '2', name: 'Marketing', userCount: 3 },
    { id: '3', name: 'Ventas', userCount: 4 },
    { id: '4', name: 'Recursos Humanos', userCount: 2 }
  ]);
  const [newDeptName, setNewDeptName] = useState('');
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  // En una implementación completa, esto se conectaría con la base de datos
  
  const handleAddDepartment = () => {
    if (!newDeptName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del departamento no puede estar vacío",
        variant: "destructive"
      });
      return;
    }
    
    const newDepartment: Department = {
      id: Date.now().toString(),
      name: newDeptName,
      userCount: 0
    };
    
    setDepartments([...departments, newDepartment]);
    setNewDeptName('');
    
    toast({
      title: "Departamento creado",
      description: `El departamento "${newDeptName}" ha sido creado exitosamente`
    });
  };
  
  const handleDeleteDepartment = (deptId: string) => {
    setDepartments(departments.filter(dept => dept.id !== deptId));
    toast({
      title: "Departamento eliminado",
      description: "El departamento ha sido eliminado exitosamente"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-md font-medium">
            Crear nuevo departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Nombre del departamento"
              className="flex-1"
            />
            <Button onClick={handleAddDepartment}>
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map(dept => (
          <Card key={dept.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {dept.userCount} usuarios
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteDepartment(dept.id)}
                >
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
