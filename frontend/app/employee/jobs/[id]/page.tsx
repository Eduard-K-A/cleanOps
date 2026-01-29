'use client';

import { JobDetailContent } from '@/components/jobs/JobDetailContent';

export default function EmployeeJobDetailPage() {
  return (
    <JobDetailContent
      backPath="/employee/feed"
      backLabel="feed"
      showApprove={false}
    />
  );
}
