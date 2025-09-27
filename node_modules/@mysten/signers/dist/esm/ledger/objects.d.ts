import type { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';
export declare const getInputObjects: (transaction: Transaction, client: SuiClient) => Promise<{
    bcsObjects: Uint8Array<ArrayBuffer>[];
}>;
