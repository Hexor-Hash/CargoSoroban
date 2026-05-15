import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM escrows WHERE job_id = $1', [req.params.jobId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/deposit', authMiddleware, async (req: Request, res: Response) => {
  const { job_id, amount_xlm, tx_hash } = req.body;
  if (!job_id || !amount_xlm) { res.status(400).json({ success: false, error: 'job_id and amount_xlm required' }); return; }
  try {
    const { rows } = await pool.query(
      `INSERT INTO escrows (job_id, buyer_address, amount_xlm, tx_hash) VALUES ($1,$2,$3,$4) RETURNING *`,
      [job_id, req.walletAddress, amount_xlm, tx_hash || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/confirm', authMiddleware, async (req: Request, res: Response) => {
  const { job_id } = req.body;
  if (!job_id) { res.status(400).json({ success: false, error: 'job_id required' }); return; }
  try {
    await pool.query(`UPDATE jobs SET status='delivered', updated_at=NOW() WHERE id=$1`, [job_id]);
    res.json({ success: true, data: { job_id, status: 'delivered' } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/release', authMiddleware, async (req: Request, res: Response) => {
  const { job_id } = req.body;
  if (!job_id) { res.status(400).json({ success: false, error: 'job_id required' }); return; }
  try {
    const { rows } = await pool.query(
      `UPDATE escrows SET status='released' WHERE job_id=$1 AND status='locked' RETURNING *`,
      [job_id]
    );
    if (!rows.length) { res.status(404).json({ success: false, error: 'No locked escrow for this job' }); return; }
    await pool.query(`UPDATE jobs SET status='completed', updated_at=NOW() WHERE id=$1`, [job_id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/dispute', authMiddleware, async (req: Request, res: Response) => {
  const { job_id, reason } = req.body;
  if (!job_id || !reason) { res.status(400).json({ success: false, error: 'job_id and reason required' }); return; }
  try {
    const { rows } = await pool.query(
      `INSERT INTO disputes (job_id, raised_by, reason) VALUES ($1,$2,$3) RETURNING *`,
      [job_id, req.walletAddress, reason]
    );
    await pool.query(`UPDATE escrows SET status='disputed' WHERE job_id=$1 AND status='locked'`, [job_id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
