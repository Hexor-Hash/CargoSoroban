'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { MapPin } from 'lucide-react'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { getMarketplaceJobs, acceptJob, updateJobStatus, type Job } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export default function TransporterPage() {
  const { walletAddress } = useAppStore()
  const [available, setAvailable] = useState<Job[]>([])
  const [active, setActive] = useState<Job[]>([])
  const [reputation] = useState(4.7)

  useEffect(() => {
    getMarketplaceJobs({ status: 'open' }).then(d => setAvailable(d.jobs)).catch(() => {})
    if (walletAddress) {
      getMarketplaceJobs({ status: 'in_transit' }).then(d => setActive(d.jobs)).catch(() => {})
    }
  }, [walletAddress])

  async function handleAccept(jobId: string) {
    if (!walletAddress) return toast.error('Connect wallet first')
    try {
      const job = await acceptJob(jobId, walletAddress)
      setAvailable(prev => prev.filter(j => j.id !== jobId))
      setActive(prev => [job, ...prev])
      toast.success('Job accepted!')
    } catch {
      toast.error('Failed to accept job')
    }
  }

  async function handleUpdateStatus(jobId: string, status: string) {
    try {
      const job = await updateJobStatus(jobId, status)
      setActive(prev => prev.map(j => j.id === jobId ? job : j))
      toast.success('Status updated!')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const stats = [
    { label: 'Available Jobs', value: available.length },
    { label: 'Active Deliveries', value: active.length },
    { label: 'Completed', value: 0 },
    { label: 'Reputation Score', value: reputation.toFixed(1) },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Transporter Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-emerald-600">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Map placeholder */}
        <div className="card mb-8">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Nearby Jobs Map
          </h2>
          <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400">
            Map view — integrate Leaflet here
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Available Jobs</h2>
            <div className="space-y-3">
              {available.length === 0 ? <p className="text-gray-400 text-sm">No available jobs</p> : available.map(job => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.cargoDescription}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.pickupLocation} → {job.dropoffLocation}</p>
                      <p className="text-xs text-emerald-600 font-semibold mt-1">{job.priceXLM} XLM</p>
                    </div>
                    <button onClick={() => handleAccept(job.id)} className="btn-primary text-xs px-3 py-1.5">Accept</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Active Deliveries</h2>
            <div className="space-y-3">
              {active.length === 0 ? <p className="text-gray-400 text-sm">No active deliveries</p> : active.map(job => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.cargoDescription}</p>
                      <p className="text-xs text-gray-500 mt-1">{job.pickupLocation} → {job.dropoffLocation}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleUpdateStatus(job.id, 'in_transit')} className="btn-secondary text-xs px-2 py-1">In Transit</button>
                      <button onClick={() => handleUpdateStatus(job.id, 'delivered')} className="btn-primary text-xs px-2 py-1">Delivered</button>
                      <Link href={`/jobs/${job.id}`} className="text-xs text-emerald-600 text-center hover:underline">View</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
