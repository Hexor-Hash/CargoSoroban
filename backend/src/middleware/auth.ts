import { Request, Response, NextFunction } from 'express';
import { Keypair } from '@stellar/stellar-sdk';

declare global {
  namespace Express {
    interface Request { walletAddress?: string; }
  }
}

const AUTH_MESSAGE = 'stellarhaul-auth';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') { next(); return; }

  const address = req.headers['x-wallet-address'] as string;
  const signature = req.headers['x-signature'] as string;

  if (!address || !signature) {
    res.status(401).json({ success: false, error: 'Missing auth headers' });
    return;
  }

  try {
    const keypair = Keypair.fromPublicKey(address);
    const msgBuffer = Buffer.from(AUTH_MESSAGE);
    const sigBuffer = Buffer.from(signature, 'base64');
    const valid = keypair.verify(msgBuffer, sigBuffer);
    if (!valid) throw new Error('Invalid signature');
    req.walletAddress = address;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid signature' });
  }
}
