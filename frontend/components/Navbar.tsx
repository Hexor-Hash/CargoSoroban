'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Truck, LogOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const roleLinks: Record<string, { href: string; label: string }[]> = {
  farmer: [
    { href: '/farmer', label: 'Dashboard' },
    { href: '/marketplace', label: 'Marketplace' },
  ],
  transporter: [
    { href: '/transporter', label: 'Dashboard' },
    { href: '/marketplace', label: 'Marketplace' },
  ],
  buyer: [
    { href: '/buyer', label: 'Dashboard' },
    { href: '/marketplace', label: 'Marketplace' },
  ],
}

export default function Navbar() {
  const router = useRouter()
  const { walletAddress, role, clearWallet } = useAppStore()

  const links = role ? roleLinks[role] ?? [] : []

  function handleDisconnect() {
    clearWallet()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald-700 text-lg">
          <Truck className="w-6 h-6" />
          StellarHaul
        </Link>

        <div className="flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-emerald-700 font-medium">
              {l.label}
            </Link>
          ))}
          {!walletAddress ? (
            <Link href="/wallet" className="btn-primary text-sm">Connect Wallet</Link>
          ) : (
            <div className="flex items-center gap-3">
              {role && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full capitalize font-medium">{role}</span>
              )}
              <span className="text-xs font-mono text-gray-500 hidden sm:block">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
              </span>
              <button onClick={handleDisconnect} className="text-gray-400 hover:text-red-500 transition-colors" title="Disconnect">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
