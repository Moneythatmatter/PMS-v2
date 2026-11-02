import type { RatingsData } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface OverallRatingsProps {
  data: RatingsData & { count?: number };
}

export function OverallRatings({ data }: OverallRatingsProps) {
  if (data.count === 0) {
    return (
      <Card>
        <CardHeader title="Overall Ratings" />
        <p className="py-6 text-center text-sm text-slate-500">No guest feedback yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Overall Ratings"
        subtitle={data.count != null ? `Based on ${data.count} review${data.count === 1 ? "" : "s"}` : undefined}
      />
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
