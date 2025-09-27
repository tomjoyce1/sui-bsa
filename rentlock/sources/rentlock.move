// module rentlock::rentlock {
//     /************************************************************
//      * Minimal Rent Escrow (Hackathon Simplified Version)
//      * Renter deposits SUI into an escrow shared object.
//      * Landlord can withdraw any claimed amount (<= remaining).
//      * After landlord withdraws what they want, renter can reclaim the rest.
//      * No fees, no disputes, no juries, no deadlines.
//      ************************************************************/

//     use sui::coin::{Self, Coin};
//     use sui::clock::{Self, Clock};
//     use sui::event;
//     use std::string::{Self, String};
//     use sui::sui::SUI;

//     const E_NOT_RENTER: u64 = 1;
//     const E_NOT_LANDLORD: u64 = 2;
//     const E_AMOUNT_TOO_BIG: u64 = 3;
//     const E_EMPTY: u64 = 4;
//     // Removed unused E_ALREADY_CLAIMED constant.
//     const MAX_AMOUNT: u64 = 100_000_000;
//     const FEE_BASIS_POINTS: u64 = 100;
//     const DEPOSIT_DEADLINE_MINUTES: u64 = 15;
//     public enum EscrowState has copy, drop, store {
//         Created,
//         Funded,
//         Released,
//         Cancelled,
//         Disputed,
//         Resolved
//     }

//     public struct Escrow has key, store {
//         id: UID,
//         escrow_id: u64,
//         trade_id: u64,
//         renter: address,
//         landlord: address,
//         amount: u64,
//         fee: u64,         // Fee amount (1% of principal)
//         deposit_deadline: u64,
//         state: EscrowState,
//         sequential_escrow_address: Option<address>,
//         /// Hash (digest) of the off-chain proof stored in Walrus (e.g. blake2b256/sha3_256 bytes)
//         proof_hash: vector<u8>,
//         counter: u64,
//         funds: Option<Coin<SUI>>
//     }

//     public struct EscrowCreated has copy, drop {
//         object_id: ID,
//         escrow_id: u64,
//         trade_id: u64,
//         renter: address,
//         landlord: address,
//         arbitrator: address,
//         amount: u64,
//         fee: u64,         // Fee amount
//         deposit_deadline: u64,
//         timestamp: u64
//     }

//     public struct FundsDeposited has copy, drop {
//         object_id: ID,
//         escrow_id: u64,
//         trade_id: u64,
//         amount: u64,
//         fee: u64,         // Fee amount
//         counter: u64,
//         timestamp: u64
//     }

//     public struct EscrowReleased has copy, drop {
//         object_id: ID,
//         escrow_id: u64,
//         trade_id: u64,
//         buyer: address,
//         amount: u64,
//         fee: u64,         // Fee amount
//         counter: u64,
//         timestamp: u64,
//     }

//     public entry fun create_escrow(
//         renter: address,
//         landlord: address,
//         amount: u64,
//         escrow_id: u64, // sequential identifier for database tracking
//         clock: &Clock,
//         ctx: &mut TxContext
//     ) {

//         assert!(tx_context::sender(ctx) == renter, E102);

//         // Validate amount (section 4.A preconditions)
//         assert!(amount > 0, E100);
//         assert!(amount <= MAX_AMOUNT, E101);
        

//         // Calculate fee (1% of principal amount)
//         let fee = (amount * FEE_BASIS_POINTS) / 10000;
//         assert!(fee > 0, E108); // Ensure fee calculation is valid
        
//         // Calculate deadlines (section 1 requirements)
//         let current_time = clock::timestamp_ms(clock);
//         let deposit_deadline = current_time + (DEPOSIT_DEADLINE_MINUTES * 60 * 1000);

//         // Create new escrow ID
//         let id = object::new(ctx); // globally unique UID with metadata
//         let object_id = object::uid_to_inner(&id); // inner id only, 32-byte value
        
//         // Create escrow object as defined in section 3
//         let escrow = Escrow {
//             id,
//             escrow_id,
//             trade_id,
//             seller,
//             buyer,
//             arbitrator: ARBITRATOR_ADDRESS, // Fixed arbitrator from constants
//             amount,
//             fee,
//             deposit_deadline,
//             fiat_deadline,
//             state: EscrowState::Created,
//             counter: 0,
//             funds: option::none()
//         };

//         // Emit creation event as specified in section 6
//         event::emit(EscrowCreated {
//             object_id,
//             escrow_id,
//             trade_id,
//             seller,
//             buyer,
//             arbitrator: ARBITRATOR_ADDRESS,
//             amount,
//             fee,
//             deposit_deadline,
//             fiat_deadline,
//             sequential,
//             sequential_escrow_address,
//             timestamp: current_time
//         });

//         // Share escrow object (making it accessible to all parties)
//         transfer::share_object(escrow);
//     }

    
//     /// Landlord withdraws an amount (may be full or partial). Remaining stays locked.
//     public fun landlord_withdraw(caller: address, escrow: &mut Escrow, amount: u64, ctx: &mut TxContext) {
//         assert!(caller == escrow.landlord, E_NOT_LANDLORD);
//         let total = coin::value(&escrow.funds);
//         assert!(total > 0, E_EMPTY);
//         assert!(amount <= total, E_AMOUNT_TOO_BIG);
//         if (amount == 0) { return }; // nothing to do
//         let out = coin::split(&mut escrow.funds, amount, ctx);
//         transfer::public_transfer(out, escrow.landlord);
//         if (coin::value(&escrow.funds) == 0) {
//             escrow.state = STATE_CLOSED;
//         } else {
//             escrow.state = STATE_PARTIAL;
//         }
//     }

//     /// Renter reclaims remaining funds (only renter). Once reclaimed, escrow closes.
//     public fun renter_reclaim(caller: address, escrow: &mut Escrow, ctx: &mut TxContext) {
//         assert!(caller == escrow.renter, E_NOT_RENTER);
//         let remaining = coin::value(&escrow.funds);
//         assert!(remaining > 0, E_EMPTY);
//         let out = coin::split(&mut escrow.funds, remaining, ctx);
//         transfer::public_transfer(out, escrow.renter);
//         escrow.state = STATE_CLOSED;
//     }
// }
// // 		amount: Coin<SUI>,

// // 		deadline_ms: u64,

// // 		media_hashes: vector<vector<u8>>,
