import Link from 'next/link'
import { Truck, Shield, MapPin, Users, CheckCircle, Star, ArrowRight } from 'lucide-react'

const features = [
  { icon: Shield, title: 'Escrow Payments', desc: 'Funds locked in smart contracts until delivery confirmed by all parties.' },
  { icon: Star, title: 'On-chain Reputation', desc: 'Immutable ratings for farmers, transporters, and buyers on Soroban.' },
  { icon: MapPin, title: 'Geo-Matching', desc: 'Automatically match cargo requests with nearby available transporters.' },
  { icon: Users, title: 'Multi-party Verification', desc: 'Delivery confirmed by farmer, transporter, and buyer for trustless settlement.' },
]

const stats = [
  { label: 'Active Transporters', value: '1,240' },
  { label: 'Deliveries Completed', value: '18,500' },
  { label: 'Countries', value: '12' },
]

const steps = [
  { role: 'Farmers', color: 'emerald', steps: ['Post cargo request with pickup/dropoff', 'Set price in XLM and lock escrow', 'Confirm delivery to release payment'] },
  { role: 'Transporters', color: 'blue', steps: ['Browse nearby jobs on marketplace', 'Accept job and update status en route', 'Complete delivery and earn XLM'] },
  { role: 'Buyers', color: 'purple', steps: ['Create purchase request for produce', 'Track shipment in real-time', 'Confirm receipt to finalize escrow'] },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-900 to-emerald-700 text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Truck className="w-14 h-14 text-emerald-300" />
          </div>
          <h1 className="text-5xl font-bold mb-4">StellarHaul</h1>
          <p className="text-xl text-emerald-100 mb-8">Decentralized Logistics for Emerging Markets</p>
          <p className="text-emerald-200 mb-10 max-w-xl mx-auto">
            Connect farmers, transporters, and buyers through trustless escrow payments and on-chain reputation on Stellar.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/wallet" className="btn-primary bg-white text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
              Connect Wallet <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/marketplace" className="btn-secondary border-emerald-300 text-white hover:bg-emerald-800">
              View Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-emerald-600 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-emerald-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why StellarHaul?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="card text-center">
                <f.icon className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ role, steps: roleSteps }) => (
              <div key={role} className="card">
                <h3 className="font-bold text-lg text-emerald-700 mb-4">{role}</h3>
                <ol className="space-y-3">
                  {roleSteps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-emerald-900 text-white py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-emerald-200 mb-8">Connect your Freighter wallet and join the network.</p>
        <Link href="/wallet" className="btn-primary bg-emerald-500 hover:bg-emerald-400">
          Connect Wallet
        </Link>
      </section>
    </main>
  )
}
