import { Router, Request, Response } from 'express';
import Joi from 'joi';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { haversineDistance } from '../services/geo';

const router = Router();

const jobSchema = Joi.object({
  cargo_description: Joi.string().required(),
  pickup_lat: Joi.number().min(-90).max(90).required(),
  pickup_lng: Joi.number().min(-180).max(180).required(),
  dropoff_lat: Joi.number().min(-90).max(90).required(),
  dropoff_lng: Joi.number().min(-180).max(180).required(),
  price_xlm: Joi.number().positive().required(),
  buyer_address: Joi.string().length(56).required(),
});

// GET /nearby must be before /:id
router.get('/nearby', async (req: Request, res: Response) => {
  const { lat, lng, radius_km = '50' } = req.query;
  if (!lat || !lng) { res.status(400).json({ success: false, error: 'lat and lng required' }); return; }
  try {
    const { rows } = await pool.query(`SELECT * FROM jobs WHERE status = 'open'`);
    const nearby = rows.filter(j =>
      haversineDistance(Number(lat), Number(lng), Number(j.pickup_lat), Number(j.pickup_lng)) <= Number(radius_km)
    );
    res.json({ success: true, data: nearby });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const { status, lat, lng, radius_km } = req.query;
  try {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params: unknown[] = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    const { rows } = await pool.query(query + ' ORDER BY created_at DESC', params);
    let data = rows;
    if (lat && lng && radius_km) {
      data = rows.filter(j =>
        haversineDistance(Number(lat), Number(lng), Number(j.pickup_lat), Number(j.pickup_lng)) <= Number(radius_km)
      );
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', authMiddleware, validate(jobSchema), async (req: Request, res: Response) => {
  const { cargo_description, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, price_xlm, buyer_address } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO jobs (farmer_address, buyer_address, cargo_description, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, price_xlm)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.walletAddress, buyer_address, cargo_description, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, price_xlm]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (!rows.length) { res.status(404).json({ success: false, error: 'Job not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id/accept', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE jobs SET transporter_address=$1, status='accepted', updated_at=NOW()
       WHERE id=$2 AND status='open' RETURNING *`,
      [req.walletAddress, req.params.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, error: 'Job not found or not open' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  const { status, ipfs_proof_hash } = req.body;
  const allowed = ['in_transit', 'delivered', 'completed', 'cancelled'];
  if (!allowed.includes(status)) { res.status(400).json({ success: false, error: 'Invalid status' }); return; }
  try {
    const { rows } = await pool.query(
      `UPDATE jobs SET status=$1, ipfs_proof_hash=COALESCE($2, ipfs_proof_hash), updated_at=NOW()
       WHERE id=$3 AND (farmer_address=$4 OR transporter_address=$4 OR buyer_address=$4) RETURNING *`,
      [status, ipfs_proof_hash || null, req.params.id, req.walletAddress]
    );
    if (!rows.length) { res.status(404).json({ success: false, error: 'Job not found or unauthorized' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
