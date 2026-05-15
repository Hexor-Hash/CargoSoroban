'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '@/components/Navbar'
import { getAnalytics } from '@/lib/api'

interface Analytics {
  totalDisputes: number
  flaggedAccounts: number
  activeJobs: number
  totalVolume: number
  weeklyDeliveries: { day: string; count: number }[]
  disputes: { id: string; jobId: string; reason: string; status: string }[]
  flagged: { address: string; reason: string; flaggedAt: string }[]
  recentTxs: { hash: string; amount: number; type: string; createdAt: string }[]
}

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null)

  useEffect(() => {
    getAnalytics().then(setData).catch(() => {})
  }, [])

  function handleResolve(disputeId: string) {
    toast.success(`Dispute ${disputeId.slice(0, 8)} resolved`)
  }

  const stats = data ? [
    { label: 'Total Disputes', value: data.totalDisputes },
    { label: 'Flagged Accounts', value: data.flaggedAccounts },
    { label: 'Active Jobs', value: data.activeJobs },
    { label: 'Total Volume (XLM)', value: data.totalVolume?.toFixed(0) },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl font-bold text-emerald-600">{s.value ?? '—'}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {data?.weeklyDeliveries && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Weekly Deliveries</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weeklyDeliveries}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Disputes */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Disputes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Job ID</th>
                <th className="pb-3 pr-4">Reason</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {!data?.disputes?.length ? (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No disputes</td></tr>
              ) : data.disputes.map(d => (
                <tr key={d.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-mono text-xs">{d.id.slice(0, 8)}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{d.jobId.slice(0, 8)}</td>
                  <td className="py-3 pr-4">{d.reason}</td>
                  <td className="py-3 pr-4 capitalize">{d.status}</td>
                  <td className="py-3">
                    {d.status !== 'resolved' && (
                      <button onClick={() => handleResolve(d.id)} className="btn-primary text-xs px-3 py-1.5">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Flagged accounts */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Flagged Accounts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4">Address</th>
                <th className="pb-3 pr-4">Reason</th>
                <th className="pb-3">Flagged At</th>
              </tr>
            </thead>
            <tbody>
              {!data?.flagged?.length ? (
                <tr><td colSpan={3} className="py-6 text-center text-gray-400">No flagged accounts</td></tr>
              ) : data.flagged.map((f, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-mono text-xs">{f.address.slice(0, 12)}...</td>
                  <td className="py-3 pr-4">{f.reason}</td>
                  <td className="py-3 text-gray-500">{new Date(f.flaggedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4">Hash</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Amount (XLM)</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {!data?.recentTxs?.length ? (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">No transactions</td></tr>
              ) : data.recentTxs.map((tx, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-mono text-xs">{tx.hash.slice(0, 12)}...</td>
                  <td className="py-3 pr-4 capitalize">{tx.type}</td>
                  <td className="py-3 pr-4">{tx.amount}</td>
                  <td className="py-3 text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
