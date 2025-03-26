
import React from 'react';
import { 
  LayoutDashboard, 
  AlertCircle, 
  PieChart, 
  Users, 
  Settings, 
  UserCircle, 
  Bell,
  Clock,
  BarChart,
  Filter,
  Calendar
} from 'lucide-react';

export const DashboardIcon = () => <LayoutDashboard className="h-4 w-4" />;
export const IncidentsIcon = () => <AlertCircle className="h-4 w-4" />;
export const ReportsIcon = () => <PieChart className="h-4 w-4" />;
export const UsersIcon = () => <Users className="h-4 w-4" />;
export const SettingsIcon = () => <Settings className="h-4 w-4" />;
export const ProfileIcon = () => <UserCircle className="h-4 w-4" />;
export const NotificationsIcon = () => <Bell className="h-4 w-4" />;

// Iconos adicionales para dashboard y filtros
export const TimeIcon = () => <Clock className="h-4 w-4" />;
export const ChartIcon = () => <BarChart className="h-4 w-4" />;
export const FilterIcon = () => <Filter className="h-4 w-4" />;
export const CalendarIcon = () => <Calendar className="h-4 w-4" />;
