'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Job } from '@/types';
import { MapPin, DollarSign, ChevronRight } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onClaim?: (id: string) => void;
  onView?: (id: string) => void;
  showClaim?: boolean;
  isClaiming?: boolean;
}

const urgencyVariant = { LOW: 'secondary', NORMAL: 'default', HIGH: 'destructive' } as const;
const statusVariant = {
  OPEN: 'default',
  IN_PROGRESS: 'warning',
  PENDING_REVIEW: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'outline',
} as const;

function parseCoords(job: { location_coordinates?: unknown; location_lat?: number | null; location_lng?: number | null; location_address?: string | null }): [number | null, number | null] {
  if (job.location_lat != null && job.location_lng != null)
    return [job.location_lng, job.location_lat];
  const loc = job.location_coordinates;
  if (!loc) return [null, null];
  const o = loc as { coordinates?: [number, number] };
  if (Array.isArray(o.coordinates) && o.coordinates.length >= 2)
    return [o.coordinates[0], o.coordinates[1]];
  return [null, null];
}

export function JobCard({ job, onClaim, onView, showClaim, isClaiming }: JobCardProps) {
  const [lng, lat] = parseCoords(job);
  const canClaim = showClaim && job.status === 'OPEN' && !!onClaim;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={urgencyVariant[job.urgency]}>{job.urgency}</Badge>
            <Badge variant={statusVariant[job.status]}>{job.status.replace('_', ' ')}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {job.created_at ? new Date(job.created_at).toLocaleString() : ''}
          </p>
        </div>
        <div className="flex items-center gap-1 text-slate-700">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold">{(job.price_amount / 100).toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(lat != null && lng != null) ? (
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        ) : job.location_address ? (
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            {job.location_address}
          </p>
        ) : null}
        {Array.isArray(job.tasks) && job.tasks.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.tasks.slice(0, 5).map((t) => {
              // Tasks may be strings (older clients) or objects { id, name }.
              const key = typeof t === 'string' ? t : (t as any).id ?? JSON.stringify(t);
              const label = typeof t === 'string' ? t : (t as any).name ?? String(t);
              return (
                <span key={key} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {label}
                </span>
              );
            })}
            {(job.tasks.length > 5) && (
              <span className="text-xs text-slate-400">+{job.tasks.length - 5}</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t bg-slate-50/50">
        {onView && (
          <Button variant="outline" size="sm" onClick={() => onView(job.id)}>
            View <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {canClaim && onClaim && (
          <Button size="sm" onClick={() => onClaim(job.id)} disabled={isClaiming}>
            {isClaiming ? 'Claiming…' : 'Claim job'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
