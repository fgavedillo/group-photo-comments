
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

/**
 * Página de inicio que redirige a los usuarios según su estado de autenticación
 */
export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Comprobar si el usuario está autenticado
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        navigate('/dashboard');
      } else {
        navigate('/landing');
      }
    };
    
    checkUser();
  }, [navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-pulse">
          <h1 className="text-2xl font-semibold text-slate-700">
            Cargando...
          </h1>
          <p className="mt-2 text-slate-500">
            Iniciando la aplicación
          </p>
        </div>
      </div>
    </div>
  );
}
