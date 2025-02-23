
import { Auth } from "@/components/Auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="py-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Sistema de Gestión de Incidencias
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Accede a tu cuenta para gestionar incidencias y reportes
          </p>
        </div>
        <Auth />
      </div>
    </div>
  );
};

export default Landing;
