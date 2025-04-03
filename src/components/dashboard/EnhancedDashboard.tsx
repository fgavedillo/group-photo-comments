
import React from 'react';
import { Card } from '@/components/ui/card';

const EnhancedDashboard = () => {
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
          <p className="text-2xl font-bold">23</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium">Tiempo Medio Resolución</h3>
          <p className="text-2xl font-bold">2.5 días</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium">Incidencias Pendientes</h3>
          <p className="text-2xl font-bold">8</p>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
