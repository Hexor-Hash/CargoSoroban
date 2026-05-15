'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Wallet, Loader2 } from 'lucide-react'
import { connectWallet } from '@/lib/wallet'
import { useAppStore } from '@/lib/store'

type Role = 'farmer' | 'transporter' | 'buyer'

const roles: { value: Role; label: string; desc: string }[] = [
  { value: 'farmer', label: 'Farmer', desc: 'Post cargo requests and manage deliveries' },
  { value: 'transporter', label: 'Transporter', desc: 'Accept jobs and earn XLM for deliveries' },
  { value: 'buyer', label: 'Buyer', desc: 'Purchase produce and track shipments' },
]

export default function WalletPage() {
  const router = useRouter()
  const { walletAddress, setWallet, setRole, role } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role>(role ?? 'farmer')

  async function handleConnect() {
    setLoading(true)
    try {
      const address = await connectWallet()
      setWallet(address)
      toast.success('Wallet connected!')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    setRole(selectedRole)
    localStorage.setItem('sh_role', selectedRole)
    router.push(`/${selectedRole}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <Wallet className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Connect Wallet</h1>
          <p className="text-gray-500 mt-1">Use Freighter to access StellarHaul</p>
        </div>

        {!walletAddress ? (
          <button onClick={handleConnect} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
          </button>
        ) : (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
              <span className="text-emerald-700 font-medium">Connected: </span>
              <span className="text-emerald-900 font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</span>
            </div>

            <div>
              <p className="font-semibold text-gray-700 mb-3">Select your role</p>
              <div className="space-y-2">
                {roles.map(r => (
                  <label key={r.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedRole === r.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value={r.value} checked={selectedRole === r.value} onChange={() => setSelectedRole(r.value)} className="mt-1 accent-emerald-600" />
                    <div>
                      <div className="font-medium text-gray-900">{r.label}</div>
                      <div className="text-sm text-gray-500">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleContinue} className="btn-primary w-full">
              Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
