import React, { useEffect, useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useCompanyTheme } from '../hooks/useCompanyTheme';

interface CompanyTheme {
  primary: string;
  secondary: string;
  accent: string;
  logo: string;
}

const ThemeProvider: React.FC = ({ children }) => {
  const { currentCompany } = useCompany();
  const companyTheme = useCompanyTheme(currentCompany.id);

  return (
    <div className={`theme-${currentCompany.id}`} style={{
      '--primary-color': companyTheme.primary,
      '--secondary-color': companyTheme.secondary,
      '--accent-color': companyTheme.accent
    }}>
      {children}
    </div>
  );
};

export default ThemeProvider; 