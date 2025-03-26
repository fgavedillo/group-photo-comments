
import React, { useState } from 'react';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { MenuSection, MenuItem } from '@/components/ui/menu-section';
import { DashboardIcon, IncidentsIcon, ReportsIcon, UsersIcon, SettingsIcon, ProfileIcon, NotificationsIcon } from '@/components/icons';
import { useCompany } from '@/contexts/CompanyContext';

export const CompanySelector = () => {
  const { companies, currentCompany, setCurrentCompany } = useCompany();

  const handleCompanyChange = (companyId: string) => {
    const selected = companies.find(c => c.id === companyId);
    if (selected) {
      setCurrentCompany(selected);
    }
  };

  return (
    <Select
      value={currentCompany.id}
      onValueChange={handleCompanyChange}
    >
      <SelectTrigger className="w-64 bg-white rounded-md">
        <SelectValue placeholder="Seleccionar empresa" />
      </SelectTrigger>
      <SelectContent>
        {companies.map(company => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const MainMenu = () => {
  return (
    <nav className="space-y-1">
      {/* Sección de Empresa */}
      <MenuSection title="Empresa">
        <MenuItem icon={<DashboardIcon />} href="/dashboard">Dashboard</MenuItem>
        <MenuItem icon={<IncidentsIcon />} href="/incidents">Incidencias</MenuItem>
        <MenuItem icon={<ReportsIcon />} href="/reports">Informes</MenuItem>
      </MenuSection>

      {/* Sección de Administración */}
      <MenuSection title="Administración">
        <MenuItem icon={<UsersIcon />} href="/users">Usuarios</MenuItem>
        <MenuItem icon={<SettingsIcon />} href="/settings">Configuración</MenuItem>
      </MenuSection>

      {/* Sección de Usuario */}
      <MenuSection title="Mi Cuenta">
        <MenuItem icon={<ProfileIcon />} href="/profile">Perfil</MenuItem>
        <MenuItem icon={<NotificationsIcon />} href="/notifications">Notificaciones</MenuItem>
      </MenuSection>
    </nav>
  );
};
