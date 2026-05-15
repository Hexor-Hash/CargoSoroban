import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import jobsRouter from './routes/jobs';
import usersRouter from './routes/users';
import escrowRouter from './routes/escrow';
import ratingsRouter from './routes/ratings';
import analyticsRouter from './routes/analytics';
import adminRouter from './routes/admin';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', ts: new Date() } }));

app.use('/api/jobs', jobsRouter);
app.use('/api/users', usersRouter);
app.use('/api/escrow', escrowRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`StellarHaul backend running on port ${PORT}`));

export default app;
