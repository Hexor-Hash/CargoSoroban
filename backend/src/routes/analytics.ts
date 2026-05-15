import { Router, Request, Response } from 'express';
import pool from '../db/pool';

const router = Router();

router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE status='completed') AS completed_jobs,
        COUNT(DISTINCT transporter_address) FILTER (WHERE status IN ('accepted','in_transit')) AS active_transporters,
        COALESCE(SUM(price_xlm) FILTER (WHERE status='completed'), 0) AS total_volume_xlm,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE status='completed') / NULLIF(COUNT(*),0), 2
        ) AS success_rate
      FROM jobs
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/weekly', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('week', created_at) AS week,
        COUNT(*) AS deliveries
      FROM jobs
      WHERE created_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY week
      ORDER BY week
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/regional', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        ROUND(pickup_lat::numeric, 1) AS region_lat,
        ROUND(pickup_lng::numeric, 1) AS region_lng,
        COUNT(*) AS job_count
      FROM jobs
      GROUP BY region_lat, region_lng
      ORDER BY job_count DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
