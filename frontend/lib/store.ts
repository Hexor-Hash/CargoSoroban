import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Job } from './api'

interface AppState {
  walletAddress: string | null
  role: 'farmer' | 'transporter' | 'buyer' | null
  jobs: Job[]
  setWallet: (address: string) => void
  setRole: (role: string) => void
  clearWallet: () => void
  setJobs: (jobs: Job[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      walletAddress: null,
      role: null,
      jobs: [],
      setWallet: (address) => {
        if (typeof window !== 'undefined') localStorage.setItem('sh_wallet', address)
        set({ walletAddress: address })
      },
      setRole: (role) => set({ role: role as AppState['role'] }),
      clearWallet: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sh_wallet')
          localStorage.removeItem('sh_role')
        }
        set({ walletAddress: null, role: null, jobs: [] })
      },
      setJobs: (jobs) => set({ jobs }),
    }),
    { name: 'stellarhaul-store' }
  )
)
