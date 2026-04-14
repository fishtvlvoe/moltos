// T048: 資訊來源列表 — 展示連接狀態
import { Card, CardContent } from '@/components/ui/card';

interface Source {
  connected: boolean;
  priority: number;
  sync_interval: string;
  email?: string;
}

interface SourcesListProps {
  sources: Record<string, Source>;
}

export function SourcesList({ sources }: SourcesListProps) {
  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        已連接
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        未連接
      </span>
    );
  };

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-4 px-0">
        {Object.entries(sources).map(([sourceName, source], index) => (
          <div key={sourceName}>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex-1">
                <p className="text-gray-900 text-sm font-medium capitalize">
                  {sourceName === 'gmail' ? 'Gmail' : sourceName}
                </p>
                {source.email && (
                  <p className="text-gray-500 text-xs mt-1">{source.email}</p>
                )}
              </div>
              {getStatusBadge(source.connected)}
            </div>
            {index < Object.entries(sources).length - 1 && (
              <div className="mx-4 h-px bg-gray-100" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
