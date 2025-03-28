
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersList } from './UsersList';

type Tab = 'usuarios' | 'roles' | 'departamentos';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');

  const handleTabChange = (value: string) => {
    setActiveTab(value as Tab);
  };

  return (
    <Card className="shadow-md border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold text-primary">
          Gestión de Usuarios
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-6">
        <Tabs 
          defaultValue="usuarios" 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full h-12 mb-6">
            <TabsTrigger value="usuarios" className="text-sm">Usuarios</TabsTrigger>
            <TabsTrigger value="roles" className="text-sm">Roles</TabsTrigger>
            <TabsTrigger value="departamentos" className="text-sm">Departamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="animate-fade-in">
            <UsersList />
          </TabsContent>
          
          <TabsContent value="roles" className="animate-fade-in">
            <div>
              <h3 className="text-lg font-medium">Gestión de Roles</h3>
              <p className="text-muted-foreground mt-2">Esta funcionalidad está en desarrollo.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="departamentos" className="animate-fade-in">
            <div>
              <h3 className="text-lg font-medium">Gestión de Departamentos</h3>
              <p className="text-muted-foreground mt-2">Esta funcionalidad está en desarrollo.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
