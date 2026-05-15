#![no_std]
mod test;

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone)]
pub struct EscrowState {
    pub job_id: u64,
    pub buyer: Address,
    pub farmer: Address,
    pub transporter: Address,
    pub amount: i128,
    pub released: bool,
    pub disputed: bool,
    pub buyer_confirmed: bool,
    pub farmer_confirmed: bool,
}

#[contracttype]
pub enum DataKey {
    Escrow(u64),
    Admin,
}

const INITIALIZED: Symbol = symbol_short!("INIT");
const DEPOSITED: Symbol = symbol_short!("DEPOSIT");
const CONFIRMED: Symbol = symbol_short!("CONFIRM");
const RELEASED: Symbol = symbol_short!("RELEASE");
const DISPUTED: Symbol = symbol_short!("DISPUTE");
const RESOLVED: Symbol = symbol_short!("RESOLVED");

fn get_escrow(env: &Env, job_id: u64) -> EscrowState {
    env.storage()
        .persistent()
        .get(&DataKey::Escrow(job_id))
        .expect("escrow not found")
}

fn save_escrow(env: &Env, state: &EscrowState) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(state.job_id), state);
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn initialize(
        env: Env,
        job_id: u64,
        buyer: Address,
        farmer: Address,
        transporter: Address,
        amount: i128,
        admin: Address,
    ) {
        buyer.require_auth();
        assert!(
            !env.storage()
                .persistent()
                .has(&DataKey::Escrow(job_id)),
            "already initialized"
        );
        assert!(amount > 0, "amount must be positive");

        env.storage().persistent().set(&DataKey::Admin, &admin);

        let state = EscrowState {
            job_id,
            buyer,
            farmer,
            transporter,
            amount,
            released: false,
            disputed: false,
            buyer_confirmed: false,
            farmer_confirmed: false,
        };
        save_escrow(&env, &state);

        env.events()
            .publish((INITIALIZED, symbol_short!("escrow")), job_id);
    }

    /// Transfers `amount` of the native XLM token from `from` into this contract.
    pub fn deposit(env: Env, job_id: u64, from: Address) {
        from.require_auth();
        let state = get_escrow(&env, job_id);
        assert!(from == state.buyer, "only buyer can deposit");
        assert!(!state.released && !state.disputed, "invalid state");

        let xlm = token::Client::new(&env, &env.current_contract_address());
        // Use the Stellar asset contract for the native token via the token interface.
        // The native XLM token address on Soroban is obtained via the env.
        let native = token::Client::new(
            &env,
            &Address::from_string(
                &env,
                &soroban_sdk::String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"),
            ),
        );
        native.transfer(&from, &env.current_contract_address(), &state.amount);

        env.events()
            .publish((DEPOSITED, symbol_short!("escrow")), job_id);
    }

    /// Called by buyer or farmer to confirm delivery. When both confirm, funds are auto-released.
    pub fn confirm_delivery(env: Env, job_id: u64, confirmer: Address) {
        confirmer.require_auth();
        let mut state = get_escrow(&env, job_id);
        assert!(!state.released && !state.disputed, "invalid state");
        assert!(
            confirmer == state.buyer || confirmer == state.farmer,
            "not authorized"
        );

        if confirmer == state.buyer {
            state.buyer_confirmed = true;
        } else {
            state.farmer_confirmed = true;
        }
        save_escrow(&env, &state);

        env.events()
            .publish((CONFIRMED, symbol_short!("escrow")), (job_id, confirmer));

        if state.buyer_confirmed && state.farmer_confirmed {
            Self::release(env, job_id);
        }
    }

    /// Releases escrowed funds to the transporter. Requires both parties confirmed.
    pub fn release(env: Env, job_id: u64) {
        let mut state = get_escrow(&env, job_id);
        assert!(!state.released && !state.disputed, "invalid state");
        assert!(
            state.buyer_confirmed && state.farmer_confirmed,
            "not all parties confirmed"
        );

        state.released = true;
        save_escrow(&env, &state);

        let native = token::Client::new(
            &env,
            &Address::from_string(
                &env,
                &soroban_sdk::String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"),
            ),
        );
        native.transfer(
            &env.current_contract_address(),
            &state.transporter,
            &state.amount,
        );

        env.events()
            .publish((RELEASED, symbol_short!("escrow")), job_id);
    }

    pub fn dispute(env: Env, job_id: u64, caller: Address) {
        caller.require_auth();
        let mut state = get_escrow(&env, job_id);
        assert!(!state.released && !state.disputed, "invalid state");
        assert!(
            caller == state.buyer || caller == state.farmer || caller == state.transporter,
            "not a party"
        );

        state.disputed = true;
        save_escrow(&env, &state);

        env.events()
            .publish((DISPUTED, symbol_short!("escrow")), (job_id, caller));
    }

    pub fn resolve_dispute(
        env: Env,
        job_id: u64,
        admin: Address,
        release_to_transporter: bool,
    ) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        assert!(admin == stored_admin, "not admin");

        let mut state = get_escrow(&env, job_id);
        assert!(state.disputed && !state.released, "not in dispute");

        state.released = true;
        state.disputed = false;
        save_escrow(&env, &state);

        let native = token::Client::new(
            &env,
            &Address::from_string(
                &env,
                &soroban_sdk::String::from_str(&env, "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"),
            ),
        );
        let recipient = if release_to_transporter {
            state.transporter.clone()
        } else {
            state.buyer.clone()
        };
        native.transfer(&env.current_contract_address(), &recipient, &state.amount);

        env.events()
            .publish((RESOLVED, symbol_short!("escrow")), (job_id, release_to_transporter));
    }

    pub fn get_escrow(env: Env, job_id: u64) -> EscrowState {
        get_escrow(&env, job_id)
    }
}
