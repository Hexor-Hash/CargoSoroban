'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import RatingStars from '@/components/RatingStars'
import { getReputation } from '@/lib/api'

interface ReputationData {
  address: string
  role: string
  overallScore: number
  totalJobs: number
  successRate: number
  memberSince: string
  ratings: { score: number; comment: string; raterAddress: string; createdAt: string }[]
}

export default function ReputationPage() {
  const { address } = useParams<{ address: string }>()
  const [data, setData] = useState<ReputationData | null>(null)

  useEffect(() => {
    getReputation(address).then(setData).catch(() => {})
  }, [address])

  if (!data) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8 text-center text-gray-400">Loading profile...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <div className="card text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-emerald-700">{data.address.slice(0, 2)}</span>
          </div>
          <p className="font-mono text-sm text-gray-600">{data.address.slice(0, 12)}...{data.address.slice(-8)}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full capitalize">{data.role}</span>
          <div className="mt-4 flex justify-center">
            <RatingStars score={data.overallScore} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.overallScore.toFixed(1)}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Jobs', value: data.totalJobs },
            { label: 'Success Rate', value: `${data.successRate}%` },
            { label: 'Member Since', value: new Date(data.memberSince).getFullYear() },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl font-bold text-emerald-600">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ratings */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Ratings</h2>
          {data.ratings.length === 0 ? (
            <p className="text-gray-400 text-sm">No ratings yet</p>
          ) : (
            <div className="space-y-4">
              {data.ratings.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <RatingStars score={r.score} />
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1 font-mono">{r.raterAddress.slice(0, 12)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
