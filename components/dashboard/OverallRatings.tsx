import type { RatingsData } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface OverallRatingsProps {
  data: RatingsData;
}

export function OverallRatings({ data }: OverallRatingsProps) {
  return (
    <Card>
      <CardHeader title="Overall Ratings" />
      <div className="mb-5">
        <span className="text-3xl font-bold text-slate-900">{data.overall}</span>
        <span className="ml-1 text-sm text-slate-500">
          out of {data.maxScore}
        </span>
      </div>
      <div className="space-y-3">
        {data.categories.map((category) => (
          <div key={category.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-600">{category.label}</span>
              <span className="font-medium text-slate-900">{category.score}</span>
            </div>
            <ProgressBar value={category.score} max={data.maxScore} color="#1e293b" />
          </div>
        ))}
      </div>
    </Card>
  );
}
