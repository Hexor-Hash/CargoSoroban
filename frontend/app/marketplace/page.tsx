'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import JobCard from '@/components/JobCard'
import { getMarketplaceJobs, acceptJob, type Job, type JobFilters } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const PAGE_SIZE = 9

export default function MarketplacePage() {
  const { walletAddress, role } = useAppStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<JobFilters>({ status: 'open' })

  useEffect(() => {
    getMarketplaceJobs({ ...filters, page }).then(d => {
      setJobs(d.jobs)
      setTotal(d.total)
    }).catch(() => {})
  }, [filters, page])

  async function handleAccept(jobId: string) {
    if (!walletAddress) return toast.error('Connect wallet first')
    try {
      await acceptJob(jobId, walletAddress)
      setJobs(prev => prev.filter(j => j.id !== jobId))
      toast.success('Job accepted!')
    } catch {
      toast.error('Failed to accept job')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marketplace</h1>

        {/* Filters */}
        <div className="card mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="accepted">Accepted</option>
              <option value="in_transit">In Transit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Price (XLM)</label>
            <input type="number" placeholder="0" onChange={e => setFilters(f => ({ ...f, minPrice: Number(e.target.value) || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Price (XLM)</label>
            <input type="number" placeholder="Any" onChange={e => setFilters(f => ({ ...f, maxPrice: Number(e.target.value) || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Radius (km)</label>
            <input type="number" placeholder="Any" onChange={e => setFilters(f => ({ ...f, radius: Number(e.target.value) || undefined }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28" />
          </div>
          <button onClick={() => setPage(1)} className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>

        {/* Jobs grid */}
        {jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No jobs found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {jobs.map(job => (
              <div key={job.id} className="relative">
                <Link href={`/jobs/${job.id}`}>
                  <JobCard job={job} />
                </Link>
                {role === 'transporter' && job.status === 'open' && (
                  <button
                    onClick={() => handleAccept(job.id)}
                    className="btn-primary w-full mt-2 text-sm"
                  >
                    Accept Job
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
            <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
