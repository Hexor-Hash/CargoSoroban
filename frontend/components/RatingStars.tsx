'use client'
import { Star } from 'lucide-react'

interface Props {
  score: number
  interactive?: boolean
  onChange?: (score: number) => void
  size?: 'sm' | 'md'
}

export default function RatingStars({ score, interactive = false, onChange, size = 'md' }: Props) {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sz} ${i <= Math.round(score) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  )
}
