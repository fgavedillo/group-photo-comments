import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface KPIProps {
  messages: any[];
}

export const DashboardKPIs = ({ messages }: KPIProps) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState("");

  // Filtrar mensajes basados en los criterios seleccionados
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      const matchesEmail = !emailFilter || 
        (message.assignedEmail && 
         message.assignedEmail.toLowerCase().includes(emailFilter.toLowerCase()));
      return matchesStatus && matchesEmail;
    });
  }, [messages, statusFilter, emailFilter]);

  // Calcular estadísticas basadas en los mensajes filtrados
  const totalMessages = filteredMessages.length;
  const messagesWithImages = filteredMessages.filter(m => m.imageUrl).length;
  const uniqueUsers = new Set(filteredMessages.map(m => m.username)).size;
  
  // Datos para el gráfico
  const chartData = [
    { name: 'Total Mensajes', value: totalMessages },
    { name: 'Con Imágenes', value: messagesWithImages },
    { name: 'Usuarios Únicos', value: uniqueUsers },
  ];

  // Obtener lista única de emails asignados para sugerencias
  const uniqueEmails = useMemo(() => {
    return Array.from(new Set(messages
      .filter(m => m.assignedEmail)
      .map(m => m.assignedEmail)));
  }, [messages]);

  return (
    <div className="p-4 space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado de las acciones</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="en-estudio">En Estudio</SelectItem>
              <SelectItem value="en-curso">En Curso</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar por responsable</label>
          <Input
            type="text"
            placeholder="Buscar por email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            list="email-suggestions"
          />
          <datalist id="email-suggestions">
            {uniqueEmails.map((email) => (
              <option key={email} value={email} />
            ))}
          </datalist>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Gráfico */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={{}}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Lista de acciones filtradas */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMessages.map((message) => (
          <Card key={message.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Situación a mejorar en seguridad</h3>
                    <p className="text-sm text-gray-600">{message.securityImprovement || "No especificado"}</p>
                  </div>
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Imagen de la situación"
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Plan de acción</h3>
                    <p className="text-sm text-gray-600">{message.actionPlan || "No especificado"}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="text-sm font-medium">Estado:</span>
                      <span className="ml-2 text-sm">{message.status}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Responsable:</span>
                      <span className="ml-2 text-sm">{message.assignedEmail || "No asignado"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};