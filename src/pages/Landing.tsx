import { Auth } from "@/components/Auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Check, BarChart2, MessageSquare } from "lucide-react";
const Landing = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  return <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Gestión de Prevención de Riesgos Laborales <span className="text-blue-600">Simplificada</span>
              </h1>
              <p className="text-xl text-gray-700">PRLconecta es la solución para la gestión de incidencias de prevención de riesgos laborales en tu empresa.</p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Solicitar Demo
                </Button>
                <Button size="lg" variant="outline">
                  Conocer más
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="text-green-500" />
                  <span>Fácil implementación</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-green-500" />
                  <span>Soporte 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-green-500" />
                  <span>Cumplimiento normativo</span>
                </div>
              </div>
            </div>
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Accede a tu cuenta</h2>
                <p className="text-gray-600 mt-2">Gestiona tus incidencias y reportes</p>
              </div>
              <Auth />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Características principales</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              PRLconecta ofrece todas las herramientas necesarias para gestionar la prevención de riesgos laborales de forma eficiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-blue-50 p-8 rounded-xl text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Chat Integrado</h3>
              <p className="text-gray-600">
                Comunicación en tiempo real para reportar y gestionar incidencias instantáneamente.
              </p>
            </div>

            <div className="bg-blue-50 p-8 rounded-xl text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestión de Riesgos</h3>
              <p className="text-gray-600">
                Identifica, evalúa y controla los riesgos laborales de forma sistemática y eficaz.
              </p>
            </div>

            <div className="bg-blue-50 p-8 rounded-xl text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full mb-4">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Informes Avanzados</h3>
              <p className="text-gray-600">
                Análisis detallado y visualización de datos para tomar decisiones informadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Empresas que confían en nosotros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <p className="text-gray-600 italic mb-6">
                "PRLconecta ha transformado nuestra gestión de riesgos laborales. Ahora tenemos un control total y nuestro equipo está más seguro que nunca."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                <div className="ml-4">
                  <h4 className="font-bold">Ana Martínez</h4>
                  <p className="text-sm text-gray-500">Directora de Seguridad, Construcciones ABC</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <p className="text-gray-600 italic mb-6">
                "La facilidad de uso y los informes detallados nos han permitido reducir los incidentes en un 35% en solo seis meses."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                <div className="ml-4">
                  <h4 className="font-bold">Carlos Rodríguez</h4>
                  <p className="text-sm text-gray-500">Gerente de Operaciones, Industrias XYZ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
            <p>© 2024 PRLconecta - Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;