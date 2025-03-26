
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export const UsersList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name');
        
        if (error) throw error;
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los usuarios',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <div>
      <h2>Lista de Usuarios</h2>
      <p>Esta funcionalidad ha sido reemplazada por el nuevo componente UserManagementTab.</p>
    </div>
  );
};

export default UsersList;
