const EnhancedDashboard = () => {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Filtros Superiores */}
      <div className="col-span-12 flex gap-4 mb-6">
        <DateRangePicker />
        <DepartmentFilter />
        <StatusFilter />
      </div>

      {/* KPIs Principales */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        <KPICard
          title="Total Incidencias"
          value={23}
          trend={+4}
          icon={<IncidentIcon />}
        />
        <KPICard
          title="Tiempo Medio Resolución"
          value="2.5 días"
          trend={-0.5}
          icon={<TimeIcon />}
        />
        {/* ... más KPIs */}
      </div>

      {/* Gráficos y Tablas */}
      <div className="col-span-8">
        <IncidentsChart />
      </div>
      <div className="col-span-4">
        <PriorityDistribution />
      </div>
    </div>
  );
}; 