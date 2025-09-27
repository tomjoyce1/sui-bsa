module rentlock::contract;
// PackageID: 0x3e8fa6e916ae72eb894b84c4228d41556d099d5d4f853e7c41ebde152cc0723a

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::clock::{Self, Clock};
use std::hash;
use sui::table::{Self, Table};

const EInvalidDeposit: u64 = 1;
const EAlreadyDeposited: u64 = 2;
const EDepositDeadline: u64 = 3;
const EContractDeadline: u64 = 4;
const EOnGoingDispute: u64 = 5;
const EInvalidGuarantee: u64 = 6;
const EInvalidSender: u64 = 7;
const EInvalidDesc: u64 = 8;
const EAlreadyVoted: u64 = 9;
const ENoDispute: u64 = 10;
const EInvalidFee: u64 = 11;

public struct Dispute has store, drop {
    dispute_desc: vector<u8>,
    original_desc: vector<u8>,
    // original_images : 
    voters_seller: u64,
    voters_buyer: u64,
    proofs_seller: vector<u64>,
    proofs_buyer: vector<u64>,
    dispute_deadline: u64,
    resolved: bool,
    winner: address,
}

public struct Contract has key {
    id: UID,
    seller: address,
    buyer: address,
    price: u64,
    guarantee: u64,
    seller_guarantee: u64,
    voting_fee: u64,
    deposit_time: u64,
    contract_time: u64,
    dispute_time: u64,
    funds: Coin<SUI>,
    image_hashes: vector<u64>,
    desc_hash: vector<u8>,
    is_dispute: bool,
    dispute: Dispute,
    dispute_voters: Table<address, bool>, // false => seller, true => buyer
}

const MOCK_ADDR: address = @0x0;

fun blank_dispute() : Dispute {
    Dispute {
        dispute_desc: b"",
        original_desc: b"",
        voters_seller: 0,
        voters_buyer: 0,
        proofs_seller: vector::empty(),
        proofs_buyer: vector::empty(),
        dispute_deadline: 0,
        resolved: false,
        winner: MOCK_ADDR,
    }
}

public fun new(buyer: address, price: u64, guarantee: u64, seller_guarantee: u64, voting_fee: u64,
    deposit_time: u64, contract_time: u64, dispute_time: u64, image_hashes: vector<u64>,
    desc_hash: vector<u8>, seller_guarantee_coin: Coin<SUI>, clock: &Clock, ctx: &mut TxContext) : Contract {

    assert!(seller_guarantee_coin.value() == seller_guarantee, EInvalidGuarantee);
    let contract = Contract {
        id: object::new(ctx),
        seller: ctx.sender(),
        buyer,
        price,
        guarantee,
        seller_guarantee,
        voting_fee,
        deposit_time: clock.timestamp_ms() + deposit_time,
        contract_time: clock.timestamp_ms() + contract_time,
        dispute_time,
        funds: seller_guarantee_coin,
        image_hashes,
        desc_hash,
        is_dispute: false,
        dispute: blank_dispute(),
        dispute_voters: table::new<address, bool>(ctx),
    };
    // transfer::share_object(contract);
    contract
}

public fun make_deposit(contract: &mut Contract, coin: Coin<SUI>, clock: &Clock) {
    assert!(clock.timestamp_ms() < contract.deposit_time, EDepositDeadline);
    assert!(coin.value() == contract.price + contract.guarantee, EInvalidDeposit);
    assert!(contract.funds.value() == contract.seller_guarantee, EAlreadyDeposited);

    contract.funds.join(coin);
}

fun end_peacefully(contract: Contract, clock: &Clock, ctx: &mut TxContext) { 
    assert!(clock.timestamp_ms() > contract.contract_time, EContractDeadline);
    assert!(!contract.is_dispute, EOnGoingDispute);

    let Contract {id, mut funds, seller, buyer, guarantee, dispute_voters, ..} = contract;
    transfer::public_transfer(funds.split(guarantee, ctx), buyer);
    transfer::public_transfer(funds, seller);
    dispute_voters.drop();
    id.delete();
}

public fun raise_dispute(contract: &mut Contract, original_desc: vector<u8>, dispute_desc: vector<u8>,
    clock: &Clock, ctx: &mut TxContext) {
    assert!(clock.timestamp_ms() < contract.contract_time, EContractDeadline);
    assert!(ctx.sender() == contract.seller || ctx.sender() == contract.buyer, EInvalidSender);
    assert!(hash::sha3_256(original_desc) == contract.desc_hash, EInvalidDesc);

    contract.is_dispute = true;

    contract.dispute = Dispute {
        dispute_desc,
        original_desc,
        voters_seller: 0,
        voters_buyer: 0,
        proofs_seller: vector::empty(),
        proofs_buyer: vector::empty(),
        dispute_deadline: contract.dispute_time + clock.timestamp_ms(),
        resolved: false,
        winner: MOCK_ADDR,
    };
}

fun prepare_vote(contract: &mut Contract, fee: Coin<SUI>, ctx: &mut TxContext) {
    assert!(contract.is_dispute, ENoDispute);
    assert!(!contract.dispute_voters.contains(ctx.sender()), EAlreadyVoted);
    assert!(fee.value() == contract.voting_fee, EInvalidFee);

    contract.funds.join(fee);
}

public fun vote_seller(contract: &mut Contract, fee: Coin<SUI>, ctx: &mut TxContext) {
    contract.prepare_vote(fee, ctx);
    contract.dispute_voters.add(ctx.sender(), false);
    contract.dispute.voters_seller = contract.dispute.voters_seller+1;
}

public fun vote_buyer(contract: &mut Contract, fee: Coin<SUI>, ctx: &mut TxContext) {
    contract.prepare_vote(fee, ctx);
    contract.dispute_voters.add(ctx.sender(), true);
    contract.dispute.voters_buyer = contract.dispute.voters_buyer+1;
}

public fun resolve_dispute_voting(contract: &mut Contract, clock: &Clock, ctx: &mut TxContext) {
    assert!(ctx.sender() == contract.seller || ctx.sender() == contract.buyer, EInvalidSender);
    assert!(clock.timestamp_ms() > contract.dispute.dispute_deadline, EOnGoingDispute);
    // assert voters treshold

    let winner = if (contract.dispute.voters_seller > contract.dispute.voters_buyer) {
        contract.seller
    }
    else {
        contract.buyer
    };

    transfer::public_transfer(contract.funds.split(contract.guarantee + contract.seller_guarantee + contract.price, ctx), winner);
    contract.dispute.resolved = true;
    contract.dispute.winner = winner;
}

public fun reward_voter(contract: &mut Contract, ctx: &mut TxContext) {
    
}

#[test_only]
fun end_test(contract: Contract, ctx: &mut TxContext) { 
    let Contract {id, mut funds, seller, buyer, guarantee, dispute_voters, ..} = contract;
    transfer::public_transfer(funds.split(guarantee, ctx), buyer);
    transfer::public_transfer(funds, seller);
    dispute_voters.drop();
    id.delete();
}

#[test]
fun test_deposit() {
    use sui::test_scenario;
    use std::debug;

    let a = @0xCAFE;
    let b = @0xFACE;
    let deposit_time : u64 = 60_000;
    let mut clock : Clock;
    let mut contract : Contract;

    let mut scenario = test_scenario::begin(a);

    let seller_guarantee_coin: Coin<SUI> = coin::mint_for_testing<SUI>(10, scenario.ctx());
    {    
        clock = clock::create_for_testing(scenario.ctx());
        contract = new(b, 100, 1, 10, 1, deposit_time, deposit_time, deposit_time,
            vector::empty(), hash::sha3_256(b""), seller_guarantee_coin, &clock, scenario.ctx());
    };

    scenario.next_tx(b);
    let coin: Coin<SUI> = coin::mint_for_testing<SUI>(101, scenario.ctx());
    {    
        contract.make_deposit(coin, &clock);
        debug::print(&contract);
        clock::increment_for_testing(&mut clock, deposit_time*2);
        contract.end_peacefully(&clock, scenario.ctx());
    };

    scenario.end();
    clock.destroy_for_testing();
}

#[test]
fun test_voting() {
    use sui::test_scenario;
    use std::debug;

    let a = @0xCAFE;
    let b = @0xFACE;

    let mut voters = vector[@0xA, @0xB, @0xC, @0xD];

    let deposit_time : u64 = 60_000;
    let mut clock : Clock;
    let mut contract : Contract;

    let mut scenario = test_scenario::begin(a);

    let seller_guarantee_coin: Coin<SUI> = coin::mint_for_testing<SUI>(10, scenario.ctx());
    {    
        clock = clock::create_for_testing(scenario.ctx());
        contract = new(b, 100, 1, 10, 1, deposit_time, deposit_time, deposit_time,
            vector::empty(), hash::sha3_256(b""), seller_guarantee_coin, &clock, scenario.ctx());
    };

    scenario.next_tx(b);
    let coin: Coin<SUI> = coin::mint_for_testing<SUI>(101, scenario.ctx());
    {    
        contract.make_deposit(coin, &clock);
        contract.raise_dispute(b"", b"", &clock, scenario.ctx());
    };

    let mut i = 0;
    while (i < 4) {
        let voter = voters.pop_back();
        scenario.next_tx(voter);
        let fee: Coin<SUI> = coin::mint_for_testing<SUI>(1, scenario.ctx());
        {    
            contract.vote_seller(fee, scenario.ctx());
        };
        i = i + 1;
    };

    clock::increment_for_testing(&mut clock, deposit_time*2);

    scenario.next_tx(b);
    contract.resolve_dispute_voting(&clock, scenario.ctx());

    debug::print(&contract);

    contract.end_test(scenario.ctx());
    scenario.end();
    clock.destroy_for_testing();
}



