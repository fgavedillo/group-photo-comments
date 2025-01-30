import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KPIProps {
  messages: any[];
}

export const DashboardKPIs = ({ messages }: KPIProps) => {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [viewType, setViewType] = useState<"chart" | "table">("chart");

  // Agrupar mensajes por fecha
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
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [messages, groupBy]);

  // Estadísticas adicionales
  const stats = useMemo(() => {
    const total = messages.length;
    const withImages = messages.filter(m => m.imageUrl).length;
    const byStatus = messages.reduce((acc: { [key: string]: number }, message) => {
      acc[message.status] = (acc[message.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      withImages,
      byStatus
    };
  }, [messages]);

  return (
    <div className="p-4 space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap gap-4">
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

        <Select value={viewType} onValueChange={(value: "chart" | "table") => setViewType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de vista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chart">Gráfico</SelectItem>
            <SelectItem value="table">Tabla</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader>
          <CardTitle>Incidencias por {groupBy === 'day' ? 'día' : groupBy === 'week' ? 'semana' : 'mes'}</CardTitle>
        </CardHeader>
        <CardContent>
          {viewType === "chart" ? (
            <div className="h-[400px]">
              <ChartContainer config={{}}>
                <ResponsiveContainer>
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Incidencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Con Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withImages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-sm">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};