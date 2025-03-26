import React, { useState } from 'react';
import { Select, Option } from '@/components/ui/select';
import { MenuSection, MenuItem } from '@/components/ui/menu-section';
import { DashboardIcon, IncidentsIcon, ReportsIcon, UsersIcon, SettingsIcon, ProfileIcon, NotificationsIcon } from '@/components/icons';

const CompanySelector = () => {
  const [companies] = useState([
    { id: 1, name: "Empresa A" },
    { id: 2, name: "Empresa B" }
  ]);

  return (
    <Select
      value={currentCompany}
      onChange={handleCompanyChange}
      className="w-64 bg-white rounded-md"
    >
      {companies.map(company => (
        <Option key={company.id} value={company.id}>
          {company.name}
        </Option>
      ))}
    </Select>
  );
};

const MainMenu = () => {
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