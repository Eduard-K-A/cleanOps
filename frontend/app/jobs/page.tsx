'use client';

import React, { useState, useMemo } from 'react';
import { FilterBar } from '@/components/jobs/FilterBar';
import { JobCard } from '@/components/jobs/JobCard';
import { EmptyState } from '@/components/jobs/EmptyState';
import { Pagination } from '@/components/jobs/Pagination';

// Mock data for job listings
const mockJobs = [
  {
    id: '1',
    company: 'SparkleClean Pro',
    postedDate: '2024-01-15T10:00:00Z',
    title: 'Senior Cleaning Technician - Commercial Properties',
    location: 'San Francisco, CA',
    workMode: 'On-site' as const,
    salaryRange: '$45,000 - $65,000',
    skills: ['Commercial Cleaning', 'Floor Care', 'Equipment Maintenance', 'Team Leadership', 'Safety Protocols'],
    status: 'featured' as const
  },
  {
    id: '2',
    company: 'EcoClean Solutions',
    postedDate: '2024-01-14T14:30:00Z',
    title: 'Residential House Cleaner - Part Time',
    location: 'Los Angeles, CA',
    workMode: 'Hybrid' as const,
    salaryRange: '$25,000 - $35,000',
    skills: ['Residential Cleaning', 'Eco-Friendly Products', 'Customer Service', 'Time Management'],
    status: 'active' as const
  },
  {
    id: '3',
    company: 'MegaClean Corp',
    postedDate: '2024-01-13T09:15:00Z',
    title: 'Deep Cleaning Specialist - Immediate Start',
    location: 'New York, NY',
    workMode: 'Remote' as const,
    salaryRange: '$40,000 - $55,000',
    skills: ['Deep Cleaning', 'Carpet Care', 'Upholstery', 'Post-Construction', 'Quality Control'],
    status: 'urgent' as const
  },
  {
    id: '4',
    company: 'CleanSpace Services',
    postedDate: '2024-01-12T16:45:00Z',
    title: 'Window Cleaning Technician',
    location: 'Chicago, IL',
    workMode: 'On-site' as const,
    salaryRange: '$35,000 - $48,000',
    skills: ['Window Cleaning', 'High Rise Work', 'Safety Equipment', 'Detail Oriented'],
    status: 'active' as const
  },
  {
    id: '5',
    company: 'ProClean Dynamics',
    postedDate: '2024-01-11T11:20:00Z',
    title: 'Facility Maintenance Manager',
    location: 'Houston, TX',
    workMode: 'Hybrid' as const,
    salaryRange: '$55,000 - $75,000',
    skills: ['Facility Management', 'Team Leadership', 'Budget Management', 'Vendor Relations', 'Compliance'],
    status: 'featured' as const
  },
  {
    id: '6',
    company: 'GreenClean Co',
    postedDate: '2024-01-10T13:00:00Z',
    title: 'Eco-Friendly Cleaning Specialist',
    location: 'Seattle, WA',
    workMode: 'On-site' as const,
    salaryRange: '$38,000 - $52,000',
    skills: ['Green Cleaning', 'Chemical Safety', 'Waste Management', 'Environmental Compliance'],
    status: 'active' as const
  },
  {
    id: '7',
    company: 'TotalClean Solutions',
    postedDate: '2024-01-09T15:30:00Z',
    title: 'Industrial Cleaning Technician',
    location: 'Detroit, MI',
    workMode: 'On-site' as const,
    salaryRange: '$42,000 - $58,000',
    skills: ['Industrial Cleaning', 'Heavy Equipment', 'Safety Protocols', 'Hazardous Materials'],
    status: 'urgent' as const
  },
  {
    id: '8',
    company: 'FreshStart Cleaning',
    postedDate: '2024-01-08T10:45:00Z',
    title: 'Move-In/Move-Out Cleaning Specialist',
    location: 'Phoenix, AZ',
    workMode: 'Remote' as const,
    salaryRange: '$30,000 - $42,000',
    skills: ['Move-In Cleaning', 'Move-Out Cleaning', 'Detail Work', 'Customer Communication'],
    status: 'active' as const
  },
  {
    id: '9',
    company: 'CrystalClear Services',
    postedDate: '2024-01-07T14:15:00Z',
    title: 'Post-Construction Cleaning Lead',
    location: 'Miami, FL',
    workMode: 'Hybrid' as const,
    salaryRange: '$48,000 - $65,000',
    skills: ['Post-Construction', 'Team Management', 'Quality Assurance', 'Client Relations'],
    status: 'featured' as const
  },
  {
    id: '10',
    company: 'PureClean Professionals',
    postedDate: '2024-01-06T09:30:00Z',
    title: 'Medical Facility Cleaning Technician',
    location: 'Boston, MA',
    workMode: 'On-site' as const,
    salaryRange: '$40,000 - $56,000',
    skills: ['Medical Cleaning', 'Infection Control', 'HIPAA Compliance', 'Sanitation Protocols'],
    status: 'urgent' as const
  },
  {
    id: '11',
    company: 'Spotless Spaces',
    postedDate: '2024-01-05T16:00:00Z',
    title: 'Office Cleaning Supervisor',
    location: 'Denver, CO',
    workMode: 'Hybrid' as const,
    salaryRange: '$38,000 - $52,000',
    skills: ['Office Cleaning', 'Supervision', 'Scheduling', 'Quality Control', 'Training'],
    status: 'active' as const
  },
  {
    id: '12',
    company: 'CleanWave Technologies',
    postedDate: '2024-01-04T11:45:00Z',
    title: 'Automated Cleaning Equipment Operator',
    location: 'Austin, TX',
    workMode: 'On-site' as const,
    salaryRange: '$35,000 - $48,000',
    skills: ['Equipment Operation', 'Maintenance', 'Technology Integration', 'Efficiency Optimization'],
    status: 'active' as const
  }
];

export default function JobsPage() {
  const [filters, setFilters] = useState({
    search: '',
    jobType: [] as string[],
    category: [] as string[],
    salaryRange: '',
    datePosted: '',
    sortBy: 'Most Recent'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const jobsPerPage = 9;

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = mockJobs.filter(job => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.skills.some(skill => skill.toLowerCase().includes(searchLower))
        );
      }
      
      // Job type filter
      if (filters.jobType.length > 0) {
        if (!filters.jobType.includes(job.workMode)) {
          return false;
        }
      }
      
      return true;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'Most Recent':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'Highest Salary':
          const aSalary = parseInt(a.salaryRange.split('-')[1].replace(/[^0-9]/g, ''));
          const bSalary = parseInt(b.salaryRange.split('-')[1].replace(/[^0-9]/g, ''));
          return bSalary - aSalary;
        case 'Most Relevant':
          // Simple relevance: featured jobs first, then by date
          if (a.status === 'featured' && b.status !== 'featured') return -1;
          if (b.status === 'featured' && a.status !== 'featured') return 1;
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredAndSortedJobs.slice(startIndex, startIndex + jobsPerPage);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      jobType: [],
      category: [],
      salaryRange: '',
      datePosted: '',
      sortBy: 'Most Recent'
    });
    setCurrentPage(1);
  };

  const handleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleApplyJob = (jobId: string) => {
    setAppliedJobs(prev => {
      const newSet = new Set(prev);
      newSet.add(jobId);
      return newSet;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of job listings
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--md-background)' }}>
      {/* Filter Bar */}
      <FilterBar 
        filters={filters} 
        onFiltersChange={handleFiltersChange}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Results Count */}
        <div className="mb-8">
          <p 
            className="text-lg"
            style={{ color: 'var(--md-on-surface-muted)' }}
          >
            Showing {paginatedJobs.length} of {filteredAndSortedJobs.length} jobs
          </p>
        </div>

        {/* Job Cards Grid */}
        {paginatedJobs.length > 0 ? (
          <>
            <div 
              className="grid gap-6 mb-8"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
              }}
            >
              {paginatedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  id={job.id}
                  company={job.company}
                  postedDate={job.postedDate}
                  title={job.title}
                  location={job.location}
                  workMode={job.workMode}
                  salaryRange={job.salaryRange}
                  skills={job.skills}
                  status={job.status}
                  isSaved={savedJobs.has(job.id)}
                  isApplied={appliedJobs.has(job.id)}
                  onSave={handleSaveJob}
                  onApply={handleApplyJob}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <EmptyState onClearFilters={handleClearFilters} />
        )}
      </div>
    </div>
  );
}
