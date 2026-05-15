'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { createDeliveryRequest, getMarketplaceJobs, type Job, type DeliveryRequestData } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const emptyForm: DeliveryRequestData = {
  cargoDescription: '', pickupLat: 0, pickupLng: 0,
  dropoffLat: 0, dropoffLng: 0, pickupLocation: '', dropoffLocation: '',
  priceXLM: 0, buyerAddress: '',
}

export default function FarmerPage() {
  const { walletAddress } = useAppStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<DeliveryRequestData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (walletAddress) {
      getMarketplaceJobs({ status: undefined }).then(d => setJobs(d.jobs)).catch(() => {})
    }
  }, [walletAddress])

  const stats = [
    { label: 'Active Requests', value: jobs.filter(j => j.status === 'open').length },
    { label: 'Pending Deliveries', value: jobs.filter(j => j.status === 'accepted' || j.status === 'in_transit').length },
    { label: 'Completed', value: jobs.filter(j => j.status === 'completed').length },
    { label: 'Earnings (XLM)', value: jobs.filter(j => j.status === 'completed').reduce((s, j) => s + j.priceXLM, 0).toFixed(0) },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const job = await createDeliveryRequest(form)
      setJobs(prev => [job, ...prev])
      setShowModal(false)
      setForm(emptyForm)
      toast.success('Delivery request created!')
    } catch {
      toast.error('Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: keyof DeliveryRequestData, label: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        required
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Delivery Request
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-emerald-600">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">My Delivery Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4">Cargo</th>
                  <th className="pb-3 pr-4">Route</th>
                  <th className="pb-3 pr-4">Price (XLM)</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No requests yet</td></tr>
                ) : jobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{job.cargoDescription}</td>
                    <td className="py-3 pr-4 text-gray-500">{job.pickupLocation} → {job.dropoffLocation}</td>
                    <td className="py-3 pr-4">{job.priceXLM}</td>
                    <td className="py-3"><StatusBadge status={job.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">New Delivery Request</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {field('cargoDescription', 'Cargo Description')}
              <div className="grid grid-cols-2 gap-3">
                {field('pickupLocation', 'Pickup Location')}
                {field('dropoffLocation', 'Dropoff Location')}
                {field('pickupLat', 'Pickup Lat', 'number')}
                {field('pickupLng', 'Pickup Lng', 'number')}
                {field('dropoffLat', 'Dropoff Lat', 'number')}
                {field('dropoffLng', 'Dropoff Lng', 'number')}
              </div>
              {field('priceXLM', 'Price (XLM)', 'number')}
              {field('buyerAddress', 'Buyer Wallet Address')}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
