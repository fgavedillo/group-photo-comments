
import React from 'react';
import { 
  LayoutDashboard, 
  AlertCircle, 
  PieChart, 
  Users, 
  Settings, 
  UserCircle, 
  Bell 
} from 'lucide-react';

export const DashboardIcon = () => <LayoutDashboard className="h-4 w-4" />;
export const IncidentsIcon = () => <AlertCircle className="h-4 w-4" />;
export const ReportsIcon = () => <PieChart className="h-4 w-4" />;
export const UsersIcon = () => <Users className="h-4 w-4" />;
export const SettingsIcon = () => <Settings className="h-4 w-4" />;
export const ProfileIcon = () => <UserCircle className="h-4 w-4" />;
export const NotificationsIcon = () => <Bell className="h-4 w-4" />;
