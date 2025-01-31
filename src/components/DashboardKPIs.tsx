import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./dashboard/StatCard";
import { ChartControls } from "./dashboard/ChartControls";
import { DynamicChart } from "./dashboard/DynamicChart";
import { DistributionBar } from "./dashboard/DistributionBar";

interface KPIProps {
  messages: any[];
}

interface GroupedData {
  [key: string]: number;
}

interface ChartData {
  date: string;
  count: number;
}

interface PieData {
  name: string;
  value: number;
}

export const DashboardKPIs = ({ messages }: KPIProps) => {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");

  const { groupedData, stats, trend } = useMemo(() => {
    // Agrupar datos por fecha
    const grouped = messages.reduce((acc: GroupedData, message) => {
      const date = new Date(message.timestamp);
      let key = '';
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
          key = `Semana ${weekNumber} - ${date.getMonth() + 1}/${date.getFullYear()}`;
          break;
        case 'month':
          key = `${date.getMonth() + 1}/${date.getFullYear()}`;
          break;
      }
      
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const groupedData: ChartData[] = Object.entries(grouped).map(([date, count]) => ({
      date,
      count
    }));

    // Calcular estadísticas
    const total = messages.length;
    const withImages = messages.filter(m => m.imageUrl).length;
    const byStatus = messages.reduce((acc: GroupedData, message) => {
      const status = message.status || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const byArea = messages.reduce((acc: GroupedData, message) => {
      const area = message.area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const pieData: PieData[] = Object.entries(byStatus).map(([name, value]) => ({
      name,
      value
    }));

    // Calcular tendencia
    const lastTwo = groupedData.slice(-2);
    const trend = lastTwo.length < 2 ? 0 : 
      lastTwo[1].count - lastTwo[0].count;

    return {
      groupedData,
      stats: {
        total,
        withImages,
        byStatus,
        byArea,
        pieData
      },
      trend
    };
  }, [messages, groupBy]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Incidencias"
          value={stats.total}
          trend={trend}
          subtitle={`${Math.abs(trend)} ${trend >= 0 ? 'más' : 'menos'} que el período anterior`}
        />

        <StatCard
          title="Con Imágenes"
          value={stats.withImages}
          subtitle={`${((stats.withImages / (stats.total || 1)) * 100).toFixed(1)}% del total`}
        />

        <StatCard
          title="Por Estado"
          value={Object.keys(stats.byStatus).length}
          badges={Object.entries(stats.byStatus).map(([status, count]) => ({
            label: status,
            count
          }))}
        />
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Análisis de Incidencias</CardTitle>
            <ChartControls
              groupBy={groupBy}
              chartType={chartType}
              onGroupByChange={setGroupBy}
              onChartTypeChange={setChartType}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <DynamicChart
            type={chartType}
            data={chartType === 'pie' ? stats.pieData : groupedData}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Distribución por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byArea).map(([area, count]) => (
                <DistributionBar
                  key={area}
                  label={area}
                  value={count}
                  total={stats.total}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Estado de Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <DistributionBar
                  key={status}
                  label={status}
                  value={count}
                  total={stats.total}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};