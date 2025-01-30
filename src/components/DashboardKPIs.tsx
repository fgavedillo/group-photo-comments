import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
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

interface GroupedData {
  date: string;
  count: number;
}

interface Stats {
  total: number;
  withImages: number;
  byStatus: { [key: string]: number };
}

export const DashboardKPIs = ({ messages }: KPIProps) => {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [viewType, setViewType] = useState<"chart" | "table">("chart");

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

  const stats = useMemo(() => {
    const total = messages.length;
    const withImages = messages.filter(m => m.imageUrl).length;
    const byStatus = messages.reduce((acc: { [key: string]: number }, message) => {
      const status = message.status || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      withImages,
      byStatus
    };
  }, [messages]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
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

      <Card className="mb-2">
        <CardHeader className="pb-2">
          <CardTitle>Incidencias por {groupBy === 'day' ? 'día' : groupBy === 'week' ? 'semana' : 'mes'}</CardTitle>
        </CardHeader>
        <CardContent>
          {viewType === "chart" ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
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
                  {groupedData.map((row: GroupedData) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{row.count.toString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Con Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withImages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-sm">{status}</span>
                  <span className="font-medium">{count.toString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};