#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, Bytes, Env, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct Rating {
    pub rater: Address,
    pub ratee: Address,
    /// Score 1–5
    pub score: u32,
    /// SHA-256 hash of the comment stored off-chain
    pub comment_hash: Bytes,
    pub job_id: u64,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ReputationScore {
    pub total_score: u64,
    pub count: u64,
    pub flagged: bool,
}

#[contracttype]
pub enum DataKey {
    /// All ratings received by a user
    Ratings(Address),
    /// Aggregated reputation for a user
    Reputation(Address),
    /// Fraud guard: (rater, job_id) -> bool
    RatingExists(Address, u64),
    Admin,
}

const RATED: Symbol = symbol_short!("RATED");
const FLAGGED: Symbol = symbol_short!("FLAGGED");

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn init(env: Env, admin: Address) {
        assert!(
            !env.storage().persistent().has(&DataKey::Admin),
            "already initialized"
        );
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn submit_rating(
        env: Env,
        rater: Address,
        ratee: Address,
        score: u32,
        comment_hash: Bytes,
        job_id: u64,
    ) {
        rater.require_auth();
        assert!(score >= 1 && score <= 5, "score must be 1-5");
        assert!(rater != ratee, "cannot rate yourself");

        // Fraud prevention: one rating per job per rater
        let guard_key = DataKey::RatingExists(rater.clone(), job_id);
        assert!(
            !env.storage().persistent().has(&guard_key),
            "already rated this job"
        );
        env.storage().persistent().set(&guard_key, &true);

        let rating = Rating {
            rater: rater.clone(),
            ratee: ratee.clone(),
            score,
            comment_hash,
            job_id,
            timestamp: env.ledger().timestamp(),
        };

        // Append to ratee's rating list
        let mut ratings: Vec<Rating> = env
            .storage()
            .persistent()
            .get(&DataKey::Ratings(ratee.clone()))
            .unwrap_or_else(|| vec![&env]);
        ratings.push_back(rating);
        env.storage()
            .persistent()
            .set(&DataKey::Ratings(ratee.clone()), &ratings);

        // Update aggregated score
        let mut rep: ReputationScore = env
            .storage()
            .persistent()
            .get(&DataKey::Reputation(ratee.clone()))
            .unwrap_or(ReputationScore {
                total_score: 0,
                count: 0,
                flagged: false,
            });
        rep.total_score += score as u64;
        rep.count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Reputation(ratee.clone()), &rep);

        env.events()
            .publish((RATED, symbol_short!("rep")), (rater, ratee, score, job_id));
    }

    pub fn get_reputation(env: Env, user: Address) -> ReputationScore {
        env.storage()
            .persistent()
            .get(&DataKey::Reputation(user))
            .unwrap_or(ReputationScore {
                total_score: 0,
                count: 0,
                flagged: false,
            })
    }

    pub fn flag_user(env: Env, admin: Address, user: Address, reason_hash: Bytes) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        assert!(admin == stored_admin, "not admin");

        let mut rep: ReputationScore = env
            .storage()
            .persistent()
            .get(&DataKey::Reputation(user.clone()))
            .unwrap_or(ReputationScore {
                total_score: 0,
                count: 0,
                flagged: false,
            });
        rep.flagged = true;
        env.storage()
            .persistent()
            .set(&DataKey::Reputation(user.clone()), &rep);

        env.events()
            .publish((FLAGGED, symbol_short!("rep")), (user, reason_hash));
    }

    pub fn get_ratings_for_user(env: Env, user: Address) -> Vec<Rating> {
        env.storage()
            .persistent()
            .get(&DataKey::Ratings(user))
            .unwrap_or_else(|| vec![&env])
    }
}
