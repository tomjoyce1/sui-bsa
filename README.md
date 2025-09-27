# sui-bsa
Step 1. Parties join
There are two main parties: Tenant (payer of the deposit) and Landlord (recipient of the deposit).
Both agree to use our dApp to create an escrow contract for the deposit return.

Step 2. Upload initial evidence
When creating the contract, at least one image must be uploaded (e.g. condition of the property).
Images are uploaded to IPFS via our site → we get a CID.
The CID is stored in the escrow smart contract as initial evidence.

Step 3. Tenant funds escrow
Tenant deposits the rental security money into the escrow wallet (held by the smart contract).
The contract is now “funded.”

Step 4. Contract expiry
The contract has a set expiry date (inspection deadline).
Before this date, the Landlord must indicate whether:
All deposit is returned, or
Part of the deposit is withheld (e.g. for damages).

Step 5. Tenant dispute period
After the landlord’s declaration, the Tenant has a dispute window (e.g. 7 days).
If Tenant does not call startDispute() within that time:
Funds are released per landlord’s declaration. ✅ Done.

Step 6. Dispute process
If Tenant calls startDispute():
The contract is flagged as disputed.
Both Tenant and Landlord must upload evidence images (IPFS CIDs) to support their claims.

Step 7. Jury arbitration
The Jury (for hackathon: a single wallet acting as arbitrator) reviews the evidence.
Jury calls a resolution function, e.g.:
resolve_refund() → all/part goes to Tenant.
resolve_release() → all/part goes to Landlord.

Step 8. Jury payout
The Jury wallet also receives a small fee for arbitration (optional, but incentivizes fairness).
Once payout is made → the contract is marked resolved and closed.