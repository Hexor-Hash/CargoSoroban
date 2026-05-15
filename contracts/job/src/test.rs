#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, JobContract);
    (env, contract_id)
}

fn cargo(env: &Env) -> String {
    String::from_str(env, "Fresh tomatoes 500kg")
}

#[test]
fn test_create_job() {
    let (env, contract_id) = setup();
    let client  = JobContractClient::new(&env, &contract_id);
    let farmer  = Address::generate(&env);
    let buyer   = Address::generate(&env);

    let job_id = client.create_job(
        &farmer, &buyer,
        &(51_507_400i32), &(-127_800i32),
        &(48_856_600i32), &(23_522_00i32),
        &cargo(&env), &1_000_000i128,
    );

    assert_eq!(job_id, 1);

    let job = client.get_job(&job_id);
    assert_eq!(job.id, 1);
    assert_eq!(job.farmer, farmer);
    assert_eq!(job.buyer, buyer);
    assert_eq!(job.price, 1_000_000);
    assert_eq!(job.status, JobStatus::Open);
}

#[test]
fn test_accept_job() {
    let (env, contract_id) = setup();
    let client      = JobContractClient::new(&env, &contract_id);
    let farmer      = Address::generate(&env);
    let buyer       = Address::generate(&env);
    let transporter = Address::generate(&env);

    let job_id = client.create_job(
        &farmer, &buyer,
        &0i32, &0i32, &1i32, &1i32,
        &cargo(&env), &500_000i128,
    );

    client.accept_job(&job_id, &transporter);

    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Accepted);
    assert_eq!(job.transporter, transporter);
}

#[test]
fn test_full_lifecycle() {
    let (env, contract_id) = setup();
    let client      = JobContractClient::new(&env, &contract_id);
    let farmer      = Address::generate(&env);
    let buyer       = Address::generate(&env);
    let transporter = Address::generate(&env);

    // Create
    let job_id = client.create_job(
        &farmer, &buyer,
        &0i32, &0i32, &1i32, &1i32,
        &cargo(&env), &200_000i128,
    );
    assert_eq!(client.get_job(&job_id).status, JobStatus::Open);

    // Accept
    client.accept_job(&job_id, &transporter);
    assert_eq!(client.get_job(&job_id).status, JobStatus::Accepted);

    // Start transit
    client.start_transit(&job_id, &transporter);
    assert_eq!(client.get_job(&job_id).status, JobStatus::InTransit);

    // Complete delivery
    client.complete_delivery(&job_id, &transporter);
    assert_eq!(client.get_job(&job_id).status, JobStatus::Delivered);
}

#[test]
fn test_cancel_job() {
    let (env, contract_id) = setup();
    let client = JobContractClient::new(&env, &contract_id);
    let farmer = Address::generate(&env);
    let buyer  = Address::generate(&env);

    let job_id = client.create_job(
        &farmer, &buyer,
        &0i32, &0i32, &1i32, &1i32,
        &cargo(&env), &100_000i128,
    );

    client.cancel_job(&job_id, &farmer);

    let job = client.get_job(&job_id);
    assert_eq!(job.status, JobStatus::Cancelled);
}

#[test]
#[should_panic(expected = "job not open")]
fn test_accept_already_accepted_panics() {
    let (env, contract_id) = setup();
    let client      = JobContractClient::new(&env, &contract_id);
    let farmer      = Address::generate(&env);
    let buyer       = Address::generate(&env);
    let transporter = Address::generate(&env);

    let job_id = client.create_job(
        &farmer, &buyer,
        &0i32, &0i32, &1i32, &1i32,
        &cargo(&env), &100_000i128,
    );
    client.accept_job(&job_id, &transporter);
    client.accept_job(&job_id, &transporter); // should panic
}
