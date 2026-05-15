#![no_std]
mod test;

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum JobStatus {
    Open,
    Accepted,
    InTransit,
    Delivered,
    Disputed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Job {
    pub id: u64,
    pub farmer: Address,
    pub transporter: Address,
    pub buyer: Address,
    /// Latitude * 1_000_000 (fixed-point)
    pub pickup_lat: i32,
    /// Longitude * 1_000_000 (fixed-point)
    pub pickup_lng: i32,
    /// Latitude * 1_000_000 (fixed-point)
    pub dropoff_lat: i32,
    /// Longitude * 1_000_000 (fixed-point)
    pub dropoff_lng: i32,
    pub cargo_description: String,
    pub price: i128,
    pub status: JobStatus,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Job(u64),
    JobCounter,
    FarmerJobs(Address),
}

const CREATED: Symbol = symbol_short!("CREATED");
const ACCEPTED: Symbol = symbol_short!("ACCEPTED");
const TRANSIT: Symbol = symbol_short!("TRANSIT");
const DELIVERED: Symbol = symbol_short!("DELIVERD");
const CANCELLED: Symbol = symbol_short!("CANCELD");

fn next_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .persistent()
        .get(&DataKey::JobCounter)
        .unwrap_or(0u64)
        + 1;
    env.storage()
        .persistent()
        .set(&DataKey::JobCounter, &id);
    id
}

fn get_job(env: &Env, job_id: u64) -> Job {
    env.storage()
        .persistent()
        .get(&DataKey::Job(job_id))
        .expect("job not found")
}

fn save_job(env: &Env, job: &Job) {
    env.storage()
        .persistent()
        .set(&DataKey::Job(job.id), job);
}

#[contract]
pub struct JobContract;

#[contractimpl]
impl JobContract {
    #[allow(clippy::too_many_arguments)]
    pub fn create_job(
        env: Env,
        farmer: Address,
        buyer: Address,
        pickup_lat: i32,
        pickup_lng: i32,
        dropoff_lat: i32,
        dropoff_lng: i32,
        cargo_desc: String,
        price: i128,
    ) -> u64 {
        farmer.require_auth();
        assert!(price > 0, "price must be positive");

        let id = next_id(&env);
        // Zero address placeholder for transporter until accepted
        let transporter = farmer.clone();

        let job = Job {
            id,
            farmer: farmer.clone(),
            transporter,
            buyer,
            pickup_lat,
            pickup_lng,
            dropoff_lat,
            dropoff_lng,
            cargo_description: cargo_desc,
            price,
            status: JobStatus::Open,
            created_at: env.ledger().timestamp(),
        };
        save_job(&env, &job);

        // Track jobs per farmer
        let mut farmer_jobs: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::FarmerJobs(farmer.clone()))
            .unwrap_or_else(|| vec![&env]);
        farmer_jobs.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::FarmerJobs(farmer), &farmer_jobs);

        env.events().publish((CREATED, symbol_short!("job")), id);
        id
    }

    pub fn accept_job(env: Env, job_id: u64, transporter: Address) {
        transporter.require_auth();
        let mut job = get_job(&env, job_id);
        assert!(job.status == JobStatus::Open, "job not open");

        job.transporter = transporter.clone();
        job.status = JobStatus::Accepted;
        save_job(&env, &job);

        env.events()
            .publish((ACCEPTED, symbol_short!("job")), (job_id, transporter));
    }

    pub fn start_transit(env: Env, job_id: u64, transporter: Address) {
        transporter.require_auth();
        let mut job = get_job(&env, job_id);
        assert!(job.status == JobStatus::Accepted, "job not accepted");
        assert!(job.transporter == transporter, "not assigned transporter");

        job.status = JobStatus::InTransit;
        save_job(&env, &job);

        env.events()
            .publish((TRANSIT, symbol_short!("job")), job_id);
    }

    pub fn complete_delivery(env: Env, job_id: u64, transporter: Address) {
        transporter.require_auth();
        let mut job = get_job(&env, job_id);
        assert!(job.status == JobStatus::InTransit, "not in transit");
        assert!(job.transporter == transporter, "not assigned transporter");

        job.status = JobStatus::Delivered;
        save_job(&env, &job);

        env.events()
            .publish((DELIVERED, symbol_short!("job")), job_id);
    }

    pub fn cancel_job(env: Env, job_id: u64, caller: Address) {
        caller.require_auth();
        let mut job = get_job(&env, job_id);
        assert!(
            job.status == JobStatus::Open || job.status == JobStatus::Accepted,
            "cannot cancel"
        );
        assert!(
            caller == job.farmer || caller == job.buyer,
            "not authorized"
        );

        job.status = JobStatus::Cancelled;
        save_job(&env, &job);

        env.events()
            .publish((CANCELLED, symbol_short!("job")), job_id);
    }

    pub fn get_job(env: Env, job_id: u64) -> Job {
        get_job(&env, job_id)
    }

    pub fn get_jobs_by_farmer(env: Env, farmer: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::FarmerJobs(farmer))
            .unwrap_or_else(|| vec![&env])
    }
}
