
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useIssues } from '@/hooks/useIssues';

const EnhancedDashboard = () => {
  const { issues } = useIssues();
  const [stats, setStats] = useState({
    total: 0,
    inStudy: 0,
    inProgress: 0,
    closed: 0,
    denied: 0,
    avgResolutionDays: 0,
    pending: 0
  });

  // Update stats whenever issues change
  useEffect(() => {
    if (!issues || issues.length === 0) return;
    
    // Calculate issue stats
    const total = issues.length;
    const inStudy = issues.filter(issue => issue.status === 'en-estudio').length;
    const inProgress = issues.filter(issue => issue.status === 'en-curso').length;
    const closed = issues.filter(issue => issue.status === 'cerrada').length;
    const denied = issues.filter(issue => issue.status === 'denegado').length;
    const pending = inStudy + inProgress;
    
    // Calculate average resolution time (for closed issues)
    let avgResolutionDays = 0;
    const closedIssues = issues.filter(issue => issue.status === 'cerrada');
    if (closedIssues.length > 0) {
      // This is a simplified calculation. In a real app, you'd use the actual resolution timestamp
      const totalDays = closedIssues.reduce((sum, issue) => {
        const createdDate = new Date(issue.timestamp);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0);
      avgResolutionDays = +(totalDays / closedIssues.length).toFixed(1);
    }
    
    // Update the stats state
    setStats({
      total,
      inStudy,
      inProgress,
      closed,
      denied,
      avgResolutionDays,
      pending
    });
    
  }, [issues]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Panel principal */}
      <div className="col-span-12 mb-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold">Panel de control</h2>
          <p>Bienvenido al panel de gestión de incidencias</p>
        </Card>
      </div>

      {/* Contenido del dashboard */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-medium">Total Incidencias</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
          <div className="text-sm text-gray-500 mt-2">
            <div className="flex justify-between">
              <span>En estudio:</span>
              <span>{stats.inStudy}</span>
            </div>
            <div className="flex justify-between">
              <span>En curso:</span>
              <span>{stats.inProgress}</span>
            </div>
            <div className="flex justify-between">
              <span>Cerradas:</span>
              <span>{stats.closed}</span>
            </div>
            <div className="flex justify-between">
              <span>Denegadas:</span>
              <span>{stats.denied}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium">Tiempo Medio Resolución</h3>
          <p className="text-2xl font-bold">{stats.avgResolutionDays} días</p>
          <div className="text-sm text-gray-500 mt-2">
            Basado en {stats.closed} incidencias cerradas
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium">Incidencias Pendientes</h3>
          <p className="text-2xl font-bold">{stats.pending}</p>
          <div className="text-sm text-gray-500 mt-2">
            <div className="flex justify-between">
              <span>En estudio:</span>
              <span>{stats.inStudy}</span>
            </div>
            <div className="flex justify-between">
              <span>En curso:</span>
              <span>{stats.inProgress}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
