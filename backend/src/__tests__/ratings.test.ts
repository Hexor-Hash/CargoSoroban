import request from 'supertest';
import app from '../index';

jest.mock('../db/pool', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.walletAddress = 'GRATER1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345678';
    next();
  },
}));

import pool from '../db/pool';
const mockQuery = pool.query as jest.Mock;

const RATER   = 'GRATER1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345678';
const RATEE   = 'GRATEE1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345678';

const sampleRating = {
  id: 1,
  job_id: 42,
  rater_address: RATER,
  ratee_address: RATEE,
  score: 5,
  comment: 'Great service',
  created_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/ratings', () => {
  it('submits a rating and returns 201', async () => {
    // First query: job validation; second: insert
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42, status: 'completed' }] })
      .mockResolvedValueOnce({ rows: [sampleRating] });

    const res = await request(app)
      .post('/api/ratings')
      .set('x-wallet-address', RATER)
      .send({ job_id: 42, ratee_address: RATEE, score: 5, comment: 'Great service' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(5);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/ratings')
      .set('x-wallet-address', RATER)
      .send({ job_id: 42 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 403 when job is not completed or caller is not a party', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/ratings')
      .set('x-wallet-address', RATER)
      .send({ job_id: 42, ratee_address: RATEE, score: 4 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/ratings/:address', () => {
  it('returns ratings for an address', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [sampleRating] });

    const res = await request(app).get(`/api/ratings/${RATEE}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].ratee_address).toBe(RATEE);
  });

  it('returns empty array when no ratings', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get(`/api/ratings/${RATEE}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/ratings/:address/score', () => {
  it('returns aggregate score for an address', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ total: '3', avg_score: '4.67' }] });

    const res = await request(app).get(`/api/ratings/${RATEE}/score`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe('3');
    expect(res.body.data.avg_score).toBe('4.67');
  });
});
