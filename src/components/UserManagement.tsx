
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_roles (
            role
          )
        `);

      if (profilesError) throw profilesError;

      const formattedUsers = profilesData.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.user_roles?.[0]?.role || 'pending'
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Usuario aprobado",
        description: "El usuario ha sido aprobado exitosamente"
      });

      await loadUsers();
    } catch (error) {
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
  }, []);

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map(user => (
            <Card key={user.id} className="p-4">
              <div className="space-y-2">
                <p className="font-semibold">{user.email}</p>
                <p>{user.first_name} {user.last_name}</p>
                <p className="text-sm text-muted-foreground">
                  Rol: {user.role}
                </p>
                {user.role === 'pending' && (
                  <Button
                    onClick={() => approveUser(user.id)}
                    className="w-full"
                  >
                    Aprobar Usuario
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
