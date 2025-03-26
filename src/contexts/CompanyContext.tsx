
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company) => void;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  currentCompany: null,
  setCurrentCompany: () => {},
  loading: true,
  refreshCompanies: async () => {},
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const getCompanies = async () => {
    try {
      setLoading(true);
      
      // Fetch companies from Supabase
      const { data, error } = await supabase
        .from('companies')
        .select('*');

      if (error) throw error;
      
      // Properly transform the array
      const companyList: Company[] = data.map(company => ({
        id: company.id,
        name: company.name,
        created_at: company.created_at,
        updated_at: company.updated_at
      }));

      setCompanies(companyList);
      
      // Set the first company as current if none is set
      if (companyList.length > 0 && !currentCompany) {
        setCurrentCompany(companyList[0]);
      }
      
      return companyList;
    } catch (error) {
      console.error('Error fetching companies:', error);
      
      // Fallback to mock data if error
      const mockCompanies: Company[] = [
        { 
          id: '1', 
          name: 'Empresa Demo', 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setCompanies(mockCompanies);
      if (!currentCompany) {
        setCurrentCompany(mockCompanies[0]);
      }
      
      return mockCompanies;
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies on initial load
  useEffect(() => {
    getCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        setCurrentCompany,
        loading,
        refreshCompanies: getCompanies
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
