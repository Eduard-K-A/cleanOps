'use client';

import { JobDetailContent } from '@/components/jobs/JobDetailContent';

export default function CustomerJobDetailPage() {
  return (
    <JobDetailContent
      backPath="/customer/requests"
      backLabel="requests"
      showApprove={true}
    />
  );
}
