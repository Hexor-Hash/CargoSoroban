'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { getMarketplaceJobs, updateJobStatus, type Job } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export default function BuyerPage() {
  const { walletAddress } = useAppStore()
  const [orders, setOrders] = useState<Job[]>([])

  useEffect(() => {
    if (walletAddress) {
      getMarketplaceJobs({}).then(d => setOrders(d.jobs)).catch(() => {})
    }
  }, [walletAddress])

  async function handleConfirm(jobId: string) {
    try {
      const job = await updateJobStatus(jobId, 'completed')
      setOrders(prev => prev.map(o => o.id === jobId ? job : o))
      toast.success('Delivery confirmed! Escrow released.')
    } catch {
      toast.error('Failed to confirm delivery')
    }
  }

  const escrowLocked = orders.filter(o => ['accepted', 'in_transit'].includes(o.status)).reduce((s, o) => s + o.priceXLM, 0)
  const totalSpent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.priceXLM, 0)

  const stats = [
    { label: 'Active Orders', value: orders.filter(o => o.status !== 'completed').length },
    { label: 'Escrow Locked (XLM)', value: escrowLocked.toFixed(0) },
    { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
    { label: 'Total Spent (XLM)', value: totalSpent.toFixed(0) },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
          <button className="btn-primary">Create Purchase Request</button>
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
          <h2 className="font-semibold text-gray-900 mb-4">My Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4">Cargo</th>
                  <th className="pb-3 pr-4">Route</th>
                  <th className="pb-3 pr-4">Price (XLM)</th>
                  <th className="pb-3 pr-4">Escrow</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400">No orders yet</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{order.cargoDescription}</td>
                    <td className="py-3 pr-4 text-gray-500">{order.pickupLocation} → {order.dropoffLocation}</td>
                    <td className="py-3 pr-4">{order.priceXLM}</td>
                    <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
                    <td className="py-3">
                      {order.status === 'delivered' && (
                        <button onClick={() => handleConfirm(order.id)} className="btn-primary text-xs px-3 py-1.5">
                          Confirm Delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
