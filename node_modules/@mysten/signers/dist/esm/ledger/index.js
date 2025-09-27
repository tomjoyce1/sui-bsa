var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _derivationPath, _publicKey, _ledgerClient, _suiClient;
import { messageWithIntent, Signer, toSerializedSignature } from "@mysten/sui/cryptography";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";
import { getInputObjects } from "./objects.js";
import { SuiMoveObject } from "./bcs.js";
import { getInputObjects as getInputObjects2 } from "./objects.js";
const _LedgerSigner = class _LedgerSigner extends Signer {
  /**
   * Creates an instance of LedgerSigner. It's expected to call the static `fromDerivationPath` method to create an instance.
   * @example
   * ```
   * const signer = await LedgerSigner.fromDerivationPath(derivationPath, options);
   * ```
   */
  constructor({ publicKey, derivationPath, ledgerClient, suiClient }) {
    super();
    __privateAdd(this, _derivationPath);
    __privateAdd(this, _publicKey);
    __privateAdd(this, _ledgerClient);
    __privateAdd(this, _suiClient);
    __privateSet(this, _publicKey, publicKey);
    __privateSet(this, _derivationPath, derivationPath);
    __privateSet(this, _ledgerClient, ledgerClient);
    __privateSet(this, _suiClient, suiClient);
  }
  /**
   * Retrieves the key scheme used by this signer.
   */
  getKeyScheme() {
    return "ED25519";
  }
  /**
   * Retrieves the public key associated with this signer.
   * @returns The Ed25519PublicKey instance.
   */
  getPublicKey() {
    return __privateGet(this, _publicKey);
  }
  /**
   * Signs the provided transaction bytes.
   * @returns The signed transaction bytes and signature.
   */
  async signTransaction(bytes) {
    const transactionOptions = await getInputObjects(
      Transaction.from(bytes),
      __privateGet(this, _suiClient)
    ).catch(() => ({
      // Fail gracefully so network errors or serialization issues don't break transaction signing:
      bcsObjects: []
    }));
    const intentMessage = messageWithIntent("TransactionData", bytes);
    const { signature } = await __privateGet(this, _ledgerClient).signTransaction(
      __privateGet(this, _derivationPath),
      intentMessage,
      transactionOptions
    );
    return {
      bytes: toBase64(bytes),
      signature: toSerializedSignature({
        signature,
        signatureScheme: this.getKeyScheme(),
        publicKey: __privateGet(this, _publicKey)
      })
    };
  }
  /**
   * Signs the provided personal message.
   * @returns The signed message bytes and signature.
   */
  async signPersonalMessage(bytes) {
    const intentMessage = messageWithIntent(
      "PersonalMessage",
      bcs.byteVector().serialize(bytes).toBytes()
    );
    const { signature } = await __privateGet(this, _ledgerClient).signTransaction(
      __privateGet(this, _derivationPath),
      intentMessage
    );
    return {
      bytes: toBase64(bytes),
      signature: toSerializedSignature({
        signature,
        signatureScheme: this.getKeyScheme(),
        publicKey: __privateGet(this, _publicKey)
      })
    };
  }
  /**
   * Prepares the signer by fetching and setting the public key from a Ledger device.
   * It is recommended to initialize an `LedgerSigner` instance using this function.
   * @returns A promise that resolves once a `LedgerSigner` instance is prepared (public key is set).
   */
  static async fromDerivationPath(derivationPath, ledgerClient, suiClient) {
    const { publicKey } = await ledgerClient.getPublicKey(derivationPath);
    if (!publicKey) {
      throw new Error("Failed to get public key from Ledger.");
    }
    return new _LedgerSigner({
      derivationPath,
      publicKey: new Ed25519PublicKey(publicKey),
      ledgerClient,
      suiClient
    });
  }
  /**
   * Generic signing is not supported by Ledger.
   * @throws Always throws an error indicating generic signing is unsupported.
   */
  sign() {
    throw new Error("Ledger Signer does not support generic signing.");
  }
  /**
   * Generic signing is not supported by Ledger.
   * @throws Always throws an error indicating generic signing is unsupported.
   */
  signWithIntent() {
    throw new Error("Ledger Signer does not support generic signing.");
  }
};
_derivationPath = new WeakMap();
_publicKey = new WeakMap();
_ledgerClient = new WeakMap();
_suiClient = new WeakMap();
let LedgerSigner = _LedgerSigner;
export {
  LedgerSigner,
  SuiMoveObject,
  getInputObjects2 as getInputObjects
};
//# sourceMappingURL=index.js.map
