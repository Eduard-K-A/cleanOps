/**
 * Example usage of optimized API client
 * These are reference examples - not meant to be imported directly
 */

import { useOptimizedData } from '@/hooks/useOptimizedData';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
import { usePrefetch } from '@/hooks/usePrefetch';
import { api, cacheManager, performanceMonitor } from '@/lib/api';
import { JobCardSkeleton, ListSkeleton } from '@/components/ui/Skeleton';
import { RequestPriority } from '@/lib/api/requestQueue';

// Example 1: Using useOptimizedData hook
export function JobsListExample() {
  const { data, loading, error, mutate, refetch } = useOptimizedData({
    endpoint: '/jobs',
    params: { status: 'OPEN' },
    defaultValue: [],
    cacheTTL: 2 * 60 * 1000, // 2 minutes
    revalidateOnFocus: true,
    revalidateInterval: 30 * 1000, // Revalidate every 30 seconds
  });

  if (loading) return <ListSkeleton count={5} />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}

// Example 2: Optimistic updates
export function JobStatusExample({ job }: { job: any }) {
  const [currentJob, setCurrentJob] = useState(job);

  const { mutate, isLoading } = useOptimisticMutation({
    mutationFn: (status: string) => api.updateJobStatus(job.id, status),
    optimisticUpdate: (status) => ({ ...currentJob, status }),
    onSuccess: (updatedJob) => {
      setCurrentJob(updatedJob);
      toast.success('Job updated');
    },
    onError: (error) => {
      toast.error('Failed to update job');
    },
  });

  return (
    <button onClick={() => mutate('COMPLETED')} disabled={isLoading}>
      Mark Complete
    </button>
  );
}

// Example 3: Prefetching on hover
export function JobLinkExample({ jobId }: { jobId: string }) {
  const { prefetchOnHover } = usePrefetch(
    `/jobs/${jobId}`,
    () => api.get(`/jobs/${jobId}`)
  );

  return (
    <Link href={`/jobs/${jobId}`} {...prefetchOnHover()}>
      View Job
    </Link>
  );
}

// Example 4: Manual cache management
export function CacheExample() {
  // Get cached data
  const cachedJobs = cacheManager.get('/jobs', { status: 'OPEN' });

  // Invalidate cache after mutation
  const handleCreateJob = async (data: any) => {
    await api.createJob(data);
    cacheManager.invalidatePattern('/jobs/*'); // Invalidate all job-related cache
  };

  return <div>...</div>;
}

// Example 5: Performance monitoring
export function PerformanceExample() {
  useEffect(() => {
    // Log performance stats periodically
    const interval = setInterval(() => {
      const stats = performanceMonitor.getStats();
      console.log('Cache hit rate:', stats.cacheHitRate);
      console.log('Average response time:', stats.averageResponseTime);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return <div>...</div>;
}

// Example 6: Request prioritization
export function PriorityExample() {
  // Critical: Auth
  const profile = await api.getProfile(); // Uses CRITICAL priority

  // High: User actions
  const jobs = await api.getJobFeed(); // Uses HIGH priority

  // Low: Background tasks
  const analytics = await api.post('/analytics', data, {
    priority: RequestPriority.LOW,
  });
}

// Example 7: Using optimized API directly
export async function DirectApiExample() {
  // With caching
  const jobs = await optimizedApi.get('/jobs', { status: 'OPEN' }, {
    useCache: true,
    cacheTTL: 5 * 60 * 1000,
    priority: RequestPriority.HIGH,
  });

  // Without caching (fresh data)
  const freshJobs = await optimizedApi.get('/jobs', { status: 'OPEN' }, {
    useCache: false,
    priority: RequestPriority.HIGH,
  });
}
