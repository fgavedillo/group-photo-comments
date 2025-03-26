
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '@/lib/supabaseClient';

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>;
  createCompany: (data: Omit<Company, 'id' | 'created_at'>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setCompanies(data || []);
      
      // Si hay empresas pero no hay empresa actual seleccionada, seleccionar la primera
      if (data && data.length > 0 && !currentCompany) {
        setCurrentCompany(data[0]);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('No se pudieron cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id: string, data: Partial<Company>): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar la lista de empresas y la empresa actual si es necesario
      await fetchCompanies();
      
      if (currentCompany && currentCompany.id === id) {
        setCurrentCompany(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (err) {
      console.error('Error updating company:', err);
      setError('No se pudo actualizar la empresa');
      throw err;
    }
  };

  const createCompany = async (data: Omit<Company, 'id' | 'created_at'>): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('companies')
        .insert([data]);
      
      if (error) throw error;
      
      // Actualizar la lista de empresas
      await fetchCompanies();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('No se pudo crear la empresa');
      throw err;
    }
  };

  const deleteCompany = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar la lista de empresas
      await fetchCompanies();
      
      // Si la empresa actual es la que se eliminó, seleccionar otra
      if (currentCompany && currentCompany.id === id) {
        setCurrentCompany(companies.length > 0 ? companies[0] : null);
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      setError('No se pudo eliminar la empresa');
      throw err;
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        setCurrentCompany,
        loading,
        error,
        fetchCompanies,
        updateCompany,
        createCompany,
        deleteCompany
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
