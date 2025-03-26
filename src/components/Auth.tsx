
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Iniciando sesión...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('Inicio de sesión exitoso:', data);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      
      // Redirigimos al dashboard después del login exitoso
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error);
      toast({
        title: "Error",
        description: "Correo electrónico o contraseña incorrectos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-500 mr-2" />
            <label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </label>
          </div>
          <Input
            id="email"
            type="email"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <Lock className="h-4 w-4 text-gray-500 mr-2" />
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </>
          )}
        </Button>
      </form>
      
      <div className="text-center pt-4 mt-2">
        <p className="text-sm text-gray-600">
          ¿No tienes una cuenta? <a href="#" className="text-blue-600 hover:underline">Solicitar acceso</a>
        </p>
      </div>
    </div>
  );
};
