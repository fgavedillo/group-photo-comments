
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Company {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company;
  setCurrentCompany: (company: Company) => void;
  isLoading: boolean;
  error: string | null;
  refreshCompanies: () => Promise<void>;
}

// Valor predeterminado para una empresa
const defaultCompany: Company = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Mi Empresa'
};

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  currentCompany: defaultCompany,
  setCurrentCompany: () => {},
  isLoading: true,
  error: null,
  refreshCompanies: async () => {}
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company>(defaultCompany);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener la sesión del usuario
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setCompanies([defaultCompany]);
        setCurrentCompany(defaultCompany);
        return;
      }
      
      // Obtener las empresas a las que pertenece el usuario
      const { data: userCompanies, error: companiesError } = await supabase
        .from('company_users')
        .select(`
          company_id,
          role,
          companies (
            id,
            name,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', session.user.id);
      
      if (companiesError) {
        throw companiesError;
      }
      
      // Formatear los datos de las empresas
      const formattedCompanies: Company[] = userCompanies.map(item => ({
        id: item.companies.id,
        name: item.companies.name,
        created_at: item.companies.created_at,
        updated_at: item.companies.updated_at
      }));
      
      // Si el usuario no tiene empresas, usar la predeterminada
      if (formattedCompanies.length === 0) {
        setCompanies([defaultCompany]);
        setCurrentCompany(defaultCompany);
      } else {
        setCompanies(formattedCompanies);
        // Usar la primera empresa como predeterminada o mantener la actual si sigue existiendo
        const existingCompany = formattedCompanies.find(c => c.id === currentCompany.id);
        setCurrentCompany(existingCompany || formattedCompanies[0]);
      }
    } catch (error: any) {
      console.error('Error cargando empresas:', error);
      setError(error.message || 'Error al cargar las empresas');
      // En caso de error, mantener la empresa predeterminada
      setCompanies([defaultCompany]);
      setCurrentCompany(defaultCompany);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar las empresas al iniciar y cuando cambie la sesión
  useEffect(() => {
    loadCompanies();
    
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCompanies();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <CompanyContext.Provider value={{
      companies,
      currentCompany,
      setCurrentCompany,
      isLoading,
      error,
      refreshCompanies: loadCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
};
