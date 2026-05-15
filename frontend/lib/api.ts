import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
})

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const address = localStorage.getItem('sh_wallet')
    if (address) config.headers['X-Wallet-Address'] = address
  }
  return config
})

export interface Job {
  id: string
  farmerAddress: string
  transporterAddress?: string
  buyerAddress?: string
  cargoDescription: string
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  pickupLocation: string
  dropoffLocation: string
  priceXLM: number
  status: 'open' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'disputed'
  createdAt: string
  distance?: number
  farmerRating?: number
}

export interface RatingData {
  jobId: string
  raterAddress: string
  rateeAddress: string
  score: number
  comment: string
}

export interface DeliveryRequestData {
  cargoDescription: string
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  pickupLocation: string
  dropoffLocation: string
  priceXLM: number
  buyerAddress: string
}

export interface JobFilters {
  status?: string
  cargoType?: string
  minPrice?: number
  maxPrice?: number
  radius?: number
  lat?: number
  lng?: number
  page?: number
}

export const createDeliveryRequest = (data: DeliveryRequestData) =>
  api.post<Job>('/jobs', data).then(r => r.data)

export const getMarketplaceJobs = (filters: JobFilters = {}) =>
  api.get<{ jobs: Job[]; total: number }>('/jobs', { params: filters }).then(r => r.data)

export const acceptJob = (jobId: string, transporterAddress: string) =>
  api.post<Job>(`/jobs/${jobId}/accept`, { transporterAddress }).then(r => r.data)

export const getJobById = (jobId: string) =>
  api.get<Job>(`/jobs/${jobId}`).then(r => r.data)

export const updateJobStatus = (jobId: string, status: string) =>
  api.patch<Job>(`/jobs/${jobId}/status`, { status }).then(r => r.data)

export const submitRating = (data: RatingData) =>
  api.post('/ratings', data).then(r => r.data)

export const getReputation = (address: string) =>
  api.get(`/reputation/${address}`).then(r => r.data)

export const getAnalytics = () =>
  api.get('/analytics').then(r => r.data)

export const getNearbyTransporters = (lat: number, lng: number, radius: number) =>
  api.get('/transporters/nearby', { params: { lat, lng, radius } }).then(r => r.data)

export default api
