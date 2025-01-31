import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ChartData {
  date: string;
  count: number;
}

interface PieData {
  name: string;
  value: number;
}

interface DynamicChartProps {
  type: "line" | "bar" | "pie";
  data: ChartData[] | PieData[];
  colors?: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const DynamicChart = ({ type, data, colors = COLORS }: DynamicChartProps) => {
  const height = 400;

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data as ChartData[]}>
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
          <BarChart data={data as ChartData[]}>
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
              data={data as PieData[]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => 
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {(data as PieData[]).map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
  }
};