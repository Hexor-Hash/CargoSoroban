import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /transporters/nearby must be before /:address
router.get('/transporters/nearby', async (req: Request, res: Response) => {
  const { lat, lng, radius_km = '50' } = req.query;
  if (!lat || !lng) { res.status(400).json({ success: false, error: 'lat and lng required' }); return; }
  try {
    const { rows } = await pool.query(
      `SELECT *, (6371 * acos(
        cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
        sin(radians($1)) * sin(radians(lat))
      )) AS distance_km
      FROM users
      WHERE role = 'transporter' AND lat IS NOT NULL AND lng IS NOT NULL
        AND (6371 * acos(
          cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )) <= $3
      ORDER BY distance_km`,
      [lat, lng, radius_km]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  const { address, role, lat, lng } = req.body;
  if (!address || !role) { res.status(400).json({ success: false, error: 'address and role required' }); return; }
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (address, role, lat, lng) VALUES ($1,$2,$3,$4)
       ON CONFLICT (address) DO UPDATE SET role=$2, lat=COALESCE($3,users.lat), lng=COALESCE($4,users.lng)
       RETURNING *`,
      [address, role, lat || null, lng || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE address = $1', [req.params.address]);
    if (!rows.length) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:address/location', authMiddleware, async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) { res.status(400).json({ success: false, error: 'lat and lng required' }); return; }
  if (req.walletAddress !== req.params.address) { res.status(403).json({ success: false, error: 'Forbidden' }); return; }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET lat=$1, lng=$2 WHERE address=$3 RETURNING *',
      [lat, lng, req.params.address]
    );
    if (!rows.length) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
