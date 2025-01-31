import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3Icon, PieChartIcon, LineChartIcon } from "lucide-react";

interface ChartControlsProps {
  groupBy: "day" | "week" | "month";
  chartType: "line" | "bar" | "pie";
  onGroupByChange: (value: "day" | "week" | "month") => void;
  onChartTypeChange: (type: "line" | "bar" | "pie") => void;
}

export const ChartControls = ({
  groupBy,
  chartType,
  onGroupByChange,
  onChartTypeChange
}: ChartControlsProps) => {
  return (
    <div className="flex gap-2">
      <Select value={groupBy} onValueChange={onGroupByChange}>
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
          onClick={() => onChartTypeChange("line")}
          className={`p-2 rounded ${chartType === "line" ? "bg-muted" : ""}`}
          title="Gráfico de líneas"
        >
          <LineChartIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChartTypeChange("bar")}
          className={`p-2 rounded ${chartType === "bar" ? "bg-muted" : ""}`}
          title="Gráfico de barras"
        >
          <BarChart3Icon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChartTypeChange("pie")}
          className={`p-2 rounded ${chartType === "pie" ? "bg-muted" : ""}`}
          title="Gráfico circular"
        >
          <PieChartIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};