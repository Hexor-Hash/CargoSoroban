import pool from './pool';

const sql = `
CREATE TABLE IF NOT EXISTS users (
  address VARCHAR(56) PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer','transporter','buyer')),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  contract_job_id BIGINT,
  farmer_address VARCHAR(56) NOT NULL,
  transporter_address VARCHAR(56),
  buyer_address VARCHAR(56),
  cargo_description TEXT NOT NULL,
  pickup_lat DECIMAL(10,7) NOT NULL,
  pickup_lng DECIMAL(10,7) NOT NULL,
  dropoff_lat DECIMAL(10,7) NOT NULL,
  dropoff_lng DECIMAL(10,7) NOT NULL,
  price_xlm DECIMAL(20,7) NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  ipfs_proof_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrows (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  buyer_address VARCHAR(56) NOT NULL,
  amount_xlm DECIMAL(20,7) NOT NULL,
  status VARCHAR(20) DEFAULT 'locked',
  tx_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  rater_address VARCHAR(56) NOT NULL,
  ratee_address VARCHAR(56) NOT NULL,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, rater_address)
);

CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  raised_by VARCHAR(56) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  resolved_by VARCHAR(56),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migration complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => { console.error(err); process.exit(1); });
