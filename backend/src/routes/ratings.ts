import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /:address/score must be before /:address
router.get('/:address/score', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total, ROUND(AVG(score)::numeric, 2) AS avg_score
       FROM ratings WHERE ratee_address = $1`,
      [req.params.address]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ratings WHERE ratee_address = $1 ORDER BY created_at DESC',
      [req.params.address]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { job_id, ratee_address, score, comment } = req.body;
  if (!job_id || !ratee_address || !score) {
    res.status(400).json({ success: false, error: 'job_id, ratee_address, score required' }); return;
  }
  try {
    const jobRes = await pool.query(
      `SELECT * FROM jobs WHERE id=$1 AND status='completed'
       AND (farmer_address=$2 OR transporter_address=$2 OR buyer_address=$2)`,
      [job_id, req.walletAddress]
    );
    if (!jobRes.rows.length) {
      res.status(403).json({ success: false, error: 'Job not completed or you are not a party' }); return;
    }
    const { rows } = await pool.query(
      `INSERT INTO ratings (job_id, rater_address, ratee_address, score, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [job_id, req.walletAddress, ratee_address, score, comment || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique')) { res.status(409).json({ success: false, error: 'Already rated this job' }); return; }
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
