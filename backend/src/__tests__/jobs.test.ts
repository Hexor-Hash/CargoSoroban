import request from 'supertest';
import app from '../index';

// Mock pg pool
jest.mock('../db/pool', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

// Mock auth middleware to inject wallet address
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.walletAddress = 'GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890';
    next();
  },
}));

import pool from '../db/pool';
const mockQuery = pool.query as jest.Mock;

const FARMER = 'GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890';
const BUYER  = 'GBUY1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890';

const sampleJob = {
  id: 1,
  farmer_address: FARMER,
  buyer_address: BUYER,
  cargo_description: 'Tomatoes',
  pickup_lat: 51.5074,
  pickup_lng: -0.1278,
  dropoff_lat: 48.8566,
  dropoff_lng: 2.3522,
  price_xlm: 100,
  status: 'open',
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/jobs', () => {
  it('creates a job and returns 201', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleJob] });

    const res = await request(app)
      .post('/api/jobs')
      .set('x-wallet-address', FARMER)
      .send({
        cargo_description: 'Tomatoes',
        pickup_lat: 51.5074,
        pickup_lng: -0.1278,
        dropoff_lat: 48.8566,
        dropoff_lng: 2.3522,
        price_xlm: 100,
        buyer_address: BUYER,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cargo_description).toBe('Tomatoes');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('x-wallet-address', FARMER)
      .send({ cargo_description: 'Tomatoes' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/jobs', () => {
  it('returns list of jobs', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleJob] });

    const res = await request(app).get('/api/jobs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns empty array when no jobs', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/jobs');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns a single job by id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleJob] });

    const res = await request(app).get('/api/jobs/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(1);
  });

  it('returns 404 when job not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/jobs/999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/jobs/:id/accept', () => {
  it('accepts a job and sets transporter', async () => {
    const accepted = { ...sampleJob, status: 'accepted', transporter_address: FARMER };
    mockQuery.mockResolvedValueOnce({ rows: [accepted] });

    const res = await request(app)
      .put('/api/jobs/1/accept')
      .set('x-wallet-address', FARMER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('accepted');
    expect(res.body.data.transporter_address).toBe(FARMER);
  });

  it('returns 404 when job not open', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/jobs/1/accept')
      .set('x-wallet-address', FARMER);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
