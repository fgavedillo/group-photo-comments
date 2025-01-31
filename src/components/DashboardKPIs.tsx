import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon, BarChart3Icon, PieChartIcon, LineChartIcon } from "lucide-react";

interface KPIProps {
  messages: any[];
}

interface GroupedData {
  date: string;
  count: number;
}

interface PieChartData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const DashboardKPIs = ({ messages }: KPIProps) => {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");

  const groupedData = useMemo(() => {
    const grouped = messages.reduce((acc: { [key: string]: number }, message) => {
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

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count
    })) as GroupedData[];
  }, [messages, groupBy]);

  const stats = useMemo(() => {
    const total = messages.length;
    const withImages = messages.filter(m => m.imageUrl).length;
    const byStatus = messages.reduce((acc: { [key: string]: number }, message) => {
      const status = message.status || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const byArea = messages.reduce((acc: { [key: string]: number }, message) => {
      const area = message.area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(byStatus).map(([name, value]) => ({
      name,
      value: value as number
    }));

    return {
      total,
      withImages,
      byStatus,
      byArea,
      pieData
    };
  }, [messages]);

  const renderChart = () => {
    const height = 400;
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={groupedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                name="Incidencias"
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={groupedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="#8884d8" 
                name="Incidencias"
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={stats.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }): string => 
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  const getStatusTrend = () => {
    if (groupedData.length < 2) return 0;
    const lastTwo = groupedData.slice(-2);
    const lastValue = lastTwo[1]?.count ?? 0;
    const previousValue = lastTwo[0]?.count ?? 0;
    return lastValue - previousValue;
  };

  const trend = getStatusTrend();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidencias</CardTitle>
            <div className={`rounded-full p-2 ${trend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {trend >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {Math.abs(trend)} {trend >= 0 ? 'más' : 'menos'} que el período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withImages}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.withImages / (stats.total || 1)) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Badge key={status} variant="secondary">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Análisis de Incidencias</CardTitle>
            <div className="flex gap-2">
              <Select value={groupBy} onValueChange={(value: "day" | "week" | "month") => setGroupBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Por día</SelectItem>
                  <SelectItem value="week">Por semana</SelectItem>
                  <SelectItem value="month">Por mes</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-1 border rounded-md p-1">
                <button
                  onClick={() => setChartType("line")}
                  className={`p-2 rounded ${chartType === "line" ? "bg-muted" : ""}`}
                >
                  <LineChartIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-2 rounded ${chartType === "bar" ? "bg-muted" : ""}`}
                >
                  <BarChart3Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setChartType("pie")}
                  className={`p-2 rounded ${chartType === "pie" ? "bg-muted" : ""}`}
                >
                  <PieChartIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {renderChart()}
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
                <div key={area} className="flex items-center justify-between">
                  <span>{area}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${((count as number) / (stats.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {((count as number / (stats.total || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
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
                <div key={status} className="flex items-center justify-between">
                  <span>{status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${((count as number) / (stats.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {((count as number / (stats.total || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};