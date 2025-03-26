
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CompanyTheme {
  primary: string;
  secondary: string;
  accent: string;
  logo: string;
}

const defaultTheme: CompanyTheme = {
  primary: '#128C7E',
  secondary: '#DCF8C6',
  accent: '#25D366',
  logo: ''
};

export const useCompanyTheme = (companyId: string) => {
  const [theme, setTheme] = useState<CompanyTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCompanyTheme = async () => {
      try {
        setIsLoading(true);
        
        if (!companyId || companyId === '00000000-0000-0000-0000-000000000000') {
          setTheme(defaultTheme);
          return;
        }
        
        // En un sistema real, esto obtendría los datos del tema de la empresa desde la base de datos
        const { data, error } = await supabase
          .from('company_themes')
          .select('*')
          .eq('company_id', companyId)
          .single();
        
        if (error) {
          // Si no hay un tema configurado, usamos el predeterminado
          if (error.code === 'PGRST116') {
            setTheme(defaultTheme);
          } else {
            throw new Error(error.message);
          }
        } else if (data) {
          setTheme({
            primary: data.primary_color || defaultTheme.primary,
            secondary: data.secondary_color || defaultTheme.secondary,
            accent: data.accent_color || defaultTheme.accent,
            logo: data.logo_url || defaultTheme.logo
          });
        } else {
          setTheme(defaultTheme);
        }
      } catch (err: any) {
        console.error('Error fetching company theme:', err);
        setError(err);
        // En caso de error, usamos el tema predeterminado
        setTheme(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyTheme();
  }, [companyId]);

  return theme;
};
