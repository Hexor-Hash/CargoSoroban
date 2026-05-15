import Link from 'next/link'
import { MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'
import RatingStars from './RatingStars'
import type { Job } from '@/lib/api'

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer h-full">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{job.cargoDescription}</h3>
        <StatusBadge status={job.status} />
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{job.pickupLocation}</span>
        <span className="mx-1">→</span>
        <span className="truncate">{job.dropoffLocation}</span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-emerald-600 font-bold">{job.priceXLM} XLM</span>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {job.farmerRating !== undefined && <RatingStars score={job.farmerRating} size="sm" />}
          {job.distance !== undefined && <span>{job.distance.toFixed(1)} km</span>}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <Link href={`/reputation/${job.farmerAddress}`} className="text-xs text-gray-400 font-mono hover:text-emerald-600">
          {job.farmerAddress.slice(0, 8)}...
        </Link>
      </div>
    </div>
  )
}
