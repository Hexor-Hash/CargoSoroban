const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  accepted: 'bg-yellow-100 text-yellow-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  disputed: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  accepted: 'Accepted',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed: 'Disputed',
}

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
