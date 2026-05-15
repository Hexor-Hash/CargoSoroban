'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle, Circle, MapPin } from 'lucide-react'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import RatingStars from '@/components/RatingStars'
import { getJobById, updateJobStatus, submitRating, type Job } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const TIMELINE = [
  { key: 'open', label: 'Created' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
]

const ORDER = ['open', 'accepted', 'in_transit', 'delivered', 'completed']

export default function JobPage() {
  const { id } = useParams<{ id: string }>()
  const { walletAddress, role } = useAppStore()
  const [job, setJob] = useState<Job | null>(null)
  const [rating, setRating] = useState({ score: 5, comment: '' })
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    getJobById(id).then(setJob).catch(() => toast.error('Job not found'))
  }, [id])

  async function handleStatusUpdate(status: string) {
    try {
      const updated = await updateJobStatus(id, status)
      setJob(updated)
      toast.success('Status updated!')
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleRating(e: React.FormEvent) {
    e.preventDefault()
    if (!job || !walletAddress) return
    const rateeAddress = role === 'farmer' ? job.transporterAddress! : job.farmerAddress
    try {
      await submitRating({ jobId: id, raterAddress: walletAddress, rateeAddress, ...rating })
      toast.success('Rating submitted!')
      setShowRating(false)
    } catch {
      toast.error('Failed to submit rating')
    }
  }

  if (!job) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="p-8 text-center text-gray-400">Loading...</div></div>

  const currentIdx = ORDER.indexOf(job.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job.cargoDescription}</h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {job.pickupLocation} → {job.dropoffLocation}
              </p>
            </div>
            <div className="text-right">
              <StatusBadge status={job.status} />
              <p className="text-emerald-600 font-bold text-lg mt-1">{job.priceXLM} XLM</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Status Timeline</h2>
          <div className="flex items-center gap-0">
            {TIMELINE.map((step, i) => {
              const done = ORDER.indexOf(step.key) <= currentIdx
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    {done ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <Circle className="w-6 h-6 text-gray-300" />}
                    <span className="text-xs mt-1 text-gray-500 whitespace-nowrap">{step.label}</span>
                  </div>
                  {i < TIMELINE.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${done ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Route Map</h2>
          <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400">
            Map — {job.pickupLat},{job.pickupLng} → {job.dropoffLat},{job.dropoffLng}
          </div>
        </div>

        {/* Parties */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Parties Involved</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Farmer', address: job.farmerAddress },
              { label: 'Transporter', address: job.transporterAddress },
              { label: 'Buyer', address: job.buyerAddress },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-600">{p.label}</span>
                <span className="font-mono text-gray-800 text-xs">{p.address ? `${p.address.slice(0, 8)}...${p.address.slice(-8)}` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Escrow */}
        <div className="card bg-emerald-50 border-emerald-200">
          <h2 className="font-semibold text-emerald-900 mb-2">Escrow Status</h2>
          <p className="text-emerald-700 text-sm">
            {job.status === 'completed' ? '✅ Escrow released — payment sent to transporter.' :
             job.status === 'open' ? '⏳ Awaiting escrow lock on job acceptance.' :
             `🔒 ${job.priceXLM} XLM locked in escrow.`}
          </p>
        </div>

        {/* Actions */}
        <div className="card flex flex-wrap gap-3">
          {role === 'transporter' && job.status === 'accepted' && (
            <button onClick={() => handleStatusUpdate('in_transit')} className="btn-primary">Mark In Transit</button>
          )}
          {role === 'transporter' && job.status === 'in_transit' && (
            <button onClick={() => handleStatusUpdate('delivered')} className="btn-primary">Mark Delivered</button>
          )}
          {role === 'buyer' && job.status === 'delivered' && (
            <button onClick={() => handleStatusUpdate('completed')} className="btn-primary">Confirm Delivery</button>
          )}
          {job.status === 'completed' && !showRating && (
            <button onClick={() => setShowRating(true)} className="btn-secondary">Leave Rating</button>
          )}
        </div>

        {/* Rating form */}
        {showRating && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Submit Rating</h2>
            <form onSubmit={handleRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Score</label>
                <RatingStars score={rating.score} interactive onChange={s => setRating(r => ({ ...r, score: s }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={rating.comment}
                  onChange={e => setRating(r => ({ ...r, comment: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRating(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Rating</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
