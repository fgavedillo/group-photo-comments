
import { useEffect, useState } from "react";
import { UserManagement } from "@/components/UserManagement";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: isAdminData, error: isAdminError } = await supabase.rpc('has_role', {
          _role: 'admin'
        });

        if (isAdminError) throw isAdminError;

        setIsAdmin(isAdminData);

        if (!isAdminData) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para acceder a esta página",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <UserManagement />
    </div>
  );
};

export default Admin;
