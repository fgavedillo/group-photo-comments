import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: number;
  trend?: number;
  subtitle?: string;
  badges?: { label: string; count: number }[];
}

export const StatCard = ({ title, value, trend, subtitle, badges }: StatCardProps) => {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend !== undefined && (
          <div className={`rounded-full p-2 ${trend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {trend >= 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {badges && (
          <div className="flex flex-wrap gap-2 mt-2">
            {badges.map(({ label, count }) => (
              <Badge key={label} variant="secondary">
                {label}: {count}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};