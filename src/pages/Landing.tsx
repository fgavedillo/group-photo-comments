
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Auth } from '@/components/Auth';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Sistema de Gestión de Incidencias</h1>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold">
                  Gestiona tus incidencias de manera eficiente
                </h2>
                <p className="text-lg text-muted-foreground">
                  Una plataforma completa para el seguimiento y gestión de incidencias, 
                  diseñada para mejorar la comunicación y eficiencia de tu equipo.
                </p>
              </div>
              <div className="bg-card rounded-lg p-8 shadow-lg">
                <Auth />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-semibold text-center mb-8">
              Características Principales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-card rounded-lg shadow-sm">
                <h4 className="text-xl font-semibold mb-3">Gestión Simplificada</h4>
                <p className="text-muted-foreground">
                  Interfaz intuitiva para crear, asignar y dar seguimiento a incidencias.
                </p>
              </div>
              <div className="p-6 bg-card rounded-lg shadow-sm">
                <h4 className="text-xl font-semibold mb-3">Comunicación en Tiempo Real</h4>
                <p className="text-muted-foreground">
                  Chat integrado para una comunicación efectiva entre el equipo.
                </p>
              </div>
              <div className="p-6 bg-card rounded-lg shadow-sm">
                <h4 className="text-xl font-semibold mb-3">Reportes Detallados</h4>
                <p className="text-muted-foreground">
                  Análisis y métricas para mejorar el rendimiento del equipo.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">
            © 2024 Sistema de Gestión de Incidencias. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
