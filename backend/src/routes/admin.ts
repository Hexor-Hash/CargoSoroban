import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db/pool';

const router = Router();

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const wallet = req.headers['x-wallet-address'];
  if (!wallet || wallet !== process.env.ADMIN_WALLET) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}

router.use(adminAuth);

router.get('/disputes', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM disputes ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/disputes/:id/resolve', async (req: Request, res: Response) => {
  const { resolution } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE disputes SET status='resolved', resolved_by=$1 WHERE id=$2 RETURNING *`,
      [req.headers['x-wallet-address'], req.params.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, error: 'Dispute not found' }); return; }
    if (resolution === 'refund') {
      await pool.query(`UPDATE escrows SET status='refunded' WHERE job_id=$1`, [rows[0].job_id]);
    } else if (resolution === 'release') {
      await pool.query(`UPDATE escrows SET status='released' WHERE job_id=$1`, [rows[0].job_id]);
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/flagged', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE flagged = TRUE`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/flag/:address', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET flagged=TRUE WHERE address=$1 RETURNING *`,
      [req.params.address]
    );
    if (!rows.length) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, j.status AS job_status, j.farmer_address, j.transporter_address
       FROM escrows e JOIN jobs j ON e.job_id = j.id
       ORDER BY e.created_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
