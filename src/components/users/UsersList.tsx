
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { useCompany } from '@/contexts/CompanyContext';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Simulación de carga de usuarios
      if (!currentCompany || !currentCompany.id) {
        console.log('No hay compañía seleccionada');
        const mockUsers: User[] = [
          { id: '1', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: 'admin' },
          { id: '2', email: 'user@example.com', first_name: 'Regular', last_name: 'User', role: 'user' },
          { id: '3', email: 'pending@example.com', first_name: 'Pending', last_name: 'User', role: 'pending' }
        ];
        setUsers(mockUsers);
        return;
      }
      
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from('company_users')
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('company_id', currentCompany.id);

      if (companyUsersError) throw companyUsersError;

      const formattedUsers = companyUsers.map(user => ({
        id: user.profiles.id,
        email: user.profiles.email || '',
        first_name: user.profiles.first_name,
        last_name: user.profiles.last_name,
        role: user.role
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
      
      // Cargar datos de ejemplo en caso de error
      const mockUsers: User[] = [
        { id: '1', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: 'admin' },
        { id: '2', email: 'user@example.com', first_name: 'Regular', last_name: 'User', role: 'user' },
        { id: '3', email: 'pending@example.com', first_name: 'Pending', last_name: 'User', role: 'pending' }
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      if (!currentCompany || !currentCompany.id) {
        toast({
          title: "Error",
          description: "No hay una compañía seleccionada",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('company_users')
        .update({ role: 'user' })
        .eq('user_id', userId)
        .eq('company_id', currentCompany.id);

      if (error) throw error;

      toast({
        title: "Usuario aprobado",
        description: "El usuario ha sido aprobado exitosamente"
      });

      await loadUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar al usuario",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentCompany]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.length === 0 ? (
        <p className="col-span-full text-center text-muted-foreground py-8">
          No hay usuarios en esta empresa
        </p>
      ) : (
        users.map(user => (
          <Card key={user.id} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium truncate">{user.email}</h3>
                  <p className="text-sm text-muted-foreground">
                    {user.first_name} {user.last_name}
                  </p>
                </div>
                <Badge 
                  variant={user.role === 'admin' ? "default" : 
                          user.role === 'pending' ? "outline" : "secondary"}
                  className="ml-2"
                >
                  {user.role}
                </Badge>
              </div>
              
              {user.role === 'pending' && (
                <Button
                  onClick={() => approveUser(user.id)}
                  className="w-full mt-2"
                  size="sm"
                >
                  Aprobar Usuario
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
