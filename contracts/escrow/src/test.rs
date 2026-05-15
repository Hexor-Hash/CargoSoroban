#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    Address, Env, IntoVal,
};

fn setup() -> (Env, Address, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, EscrowContract);
    let buyer       = Address::generate(&env);
    let farmer      = Address::generate(&env);
    let transporter = Address::generate(&env);
    let admin       = Address::generate(&env);

    (env, contract_id, buyer, farmer, transporter, admin)
}

#[test]
fn test_initialize_and_deposit() {
    let (env, contract_id, buyer, farmer, transporter, admin) = setup();
    let client = EscrowContractClient::new(&env, &contract_id);

    let job_id: u64 = 1;
    let amount: i128 = 1_000_000;

    client.initialize(&job_id, &buyer, &farmer, &transporter, &amount, &admin);

    let state = client.get_escrow(&job_id);
    assert_eq!(state.job_id, job_id);
    assert_eq!(state.buyer, buyer);
    assert_eq!(state.farmer, farmer);
    assert_eq!(state.transporter, transporter);
    assert_eq!(state.amount, amount);
    assert!(!state.released);
    assert!(!state.disputed);
    assert!(!state.buyer_confirmed);
    assert!(!state.farmer_confirmed);
}

#[test]
fn test_confirm_and_release() {
    let (env, contract_id, buyer, farmer, transporter, admin) = setup();
    let client = EscrowContractClient::new(&env, &contract_id);

    let job_id: u64 = 2;
    let amount: i128 = 500_000;

    client.initialize(&job_id, &buyer, &farmer, &transporter, &amount, &admin);

    // Buyer confirms
    client.confirm_delivery(&job_id, &buyer);
    let state = client.get_escrow(&job_id);
    assert!(state.buyer_confirmed);
    assert!(!state.farmer_confirmed);
    assert!(!state.released);

    // Farmer confirms — should auto-release
    client.confirm_delivery(&job_id, &farmer);
    let state = client.get_escrow(&job_id);
    assert!(state.farmer_confirmed);
    assert!(state.released);
}

#[test]
fn test_dispute_flow() {
    let (env, contract_id, buyer, farmer, transporter, admin) = setup();
    let client = EscrowContractClient::new(&env, &contract_id);

    let job_id: u64 = 3;
    let amount: i128 = 750_000;

    client.initialize(&job_id, &buyer, &farmer, &transporter, &amount, &admin);

    // Raise dispute
    client.dispute(&job_id, &buyer);
    let state = client.get_escrow(&job_id);
    assert!(state.disputed);
    assert!(!state.released);

    // Admin resolves in favour of transporter
    client.resolve_dispute(&job_id, &admin, &true);
    let state = client.get_escrow(&job_id);
    assert!(state.released);
    assert!(!state.disputed);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialize_panics() {
    let (env, contract_id, buyer, farmer, transporter, admin) = setup();
    let client = EscrowContractClient::new(&env, &contract_id);

    client.initialize(&1u64, &buyer, &farmer, &transporter, &1_000i128, &admin);
    client.initialize(&1u64, &buyer, &farmer, &transporter, &1_000i128, &admin);
}
