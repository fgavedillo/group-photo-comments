import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface KPIProps {
  messages: any[];
}

export const DashboardKPIs = ({ messages }: KPIProps) => {
  // Calcular estadísticas
  const totalMessages = messages.length;
  const messagesWithImages = messages.filter(m => m.imageUrl).length;
  const uniqueUsers = new Set(messages.map(m => m.username)).size;
  
  // Datos para el gráfico
  const chartData = [
    { name: 'Total Mensajes', value: totalMessages },
    { name: 'Con Imágenes', value: messagesWithImages },
    { name: 'Usuarios Únicos', value: uniqueUsers },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes con Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesWithImages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={{}}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};