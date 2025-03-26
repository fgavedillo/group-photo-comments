
import React, { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useCompanyTheme } from '../hooks/useCompanyTheme';

interface CompanyTheme {
  primary: string;
  secondary: string;
  accent: string;
  logo: string;
}

interface ThemeContextType {
  theme: CompanyTheme;
  setTheme: React.Dispatch<React.SetStateAction<CompanyTheme>>;
}

const defaultTheme: CompanyTheme = {
  primary: '#128C7E',
  secondary: '#DCF8C6',
  accent: '#25D366',
  logo: ''
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentCompany } = useCompany();
  const companyTheme = useCompanyTheme(currentCompany.id);
  const [theme, setTheme] = useState<CompanyTheme>(companyTheme || defaultTheme);

  useEffect(() => {
    if (companyTheme) {
      setTheme(companyTheme);
      
      // Apply theme variables to CSS
      document.documentElement.style.setProperty('--primary-color', companyTheme.primary);
      document.documentElement.style.setProperty('--secondary-color', companyTheme.secondary);
      document.documentElement.style.setProperty('--accent-color', companyTheme.accent);
    }
  }, [companyTheme, currentCompany.id]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div 
        className={`theme-${currentCompany.id} transition-colors duration-300`} 
        style={{
          '--primary-color': theme.primary,
          '--secondary-color': theme.secondary,
          '--accent-color': theme.accent
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
