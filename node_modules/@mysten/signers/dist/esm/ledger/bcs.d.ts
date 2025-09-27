import type { ObjectOwner } from '@mysten/sui/client';
export declare const SuiMoveObject: import("@mysten/sui/bcs").BcsStruct<{
    data: import("@mysten/sui/bcs").BcsEnum<{
        MoveObject: import("@mysten/sui/bcs").BcsStruct<{
            type: import("@mysten/sui/bcs").BcsType<any, string, string>;
            hasPublicTransfer: import("@mysten/sui/bcs").BcsType<boolean, boolean, "bool">;
            version: import("@mysten/sui/bcs").BcsType<string, string | number | bigint, "u64">;
            contents: import("@mysten/sui/bcs").BcsType<any, string, string>;
        }, string>;
    }, "Data">;
    owner: import("@mysten/sui/bcs").BcsType<any, ObjectOwner, string>;
    previousTransaction: import("@mysten/sui/bcs").BcsType<string, string, "ObjectDigest">;
    storageRebate: import("@mysten/sui/bcs").BcsType<string, string | number | bigint, "u64">;
}, string>;
