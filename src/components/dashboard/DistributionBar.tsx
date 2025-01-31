interface DistributionBarProps {
  label: string;
  value: number;
  total: number;
}

export const DistributionBar = ({ label, value, total }: DistributionBarProps) => {
  const percentage = ((value / (total || 1)) * 100).toFixed(1);
  
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {percentage}%
        </span>
      </div>
    </div>
  );
};