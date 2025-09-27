"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var ledger_exports = {};
__export(ledger_exports, {
  LedgerSigner: () => LedgerSigner,
  SuiMoveObject: () => import_bcs2.SuiMoveObject,
  getInputObjects: () => import_objects2.getInputObjects
});
module.exports = __toCommonJS(ledger_exports);
var import_cryptography = require("@mysten/sui/cryptography");
var import_ed25519 = require("@mysten/sui/keypairs/ed25519");
var import_transactions = require("@mysten/sui/transactions");
var import_utils = require("@mysten/sui/utils");
var import_bcs = require("@mysten/sui/bcs");
var import_objects = require("./objects.js");
var import_bcs2 = require("./bcs.js");
var import_objects2 = require("./objects.js");
var _derivationPath, _publicKey, _ledgerClient, _suiClient;
const _LedgerSigner = class _LedgerSigner extends import_cryptography.Signer {
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
    const transactionOptions = await (0, import_objects.getInputObjects)(
      import_transactions.Transaction.from(bytes),
      __privateGet(this, _suiClient)
    ).catch(() => ({
      // Fail gracefully so network errors or serialization issues don't break transaction signing:
      bcsObjects: []
    }));
    const intentMessage = (0, import_cryptography.messageWithIntent)("TransactionData", bytes);
    const { signature } = await __privateGet(this, _ledgerClient).signTransaction(
      __privateGet(this, _derivationPath),
      intentMessage,
      transactionOptions
    );
    return {
      bytes: (0, import_utils.toBase64)(bytes),
      signature: (0, import_cryptography.toSerializedSignature)({
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
    const intentMessage = (0, import_cryptography.messageWithIntent)(
      "PersonalMessage",
      import_bcs.bcs.byteVector().serialize(bytes).toBytes()
    );
    const { signature } = await __privateGet(this, _ledgerClient).signTransaction(
      __privateGet(this, _derivationPath),
      intentMessage
    );
    return {
      bytes: (0, import_utils.toBase64)(bytes),
      signature: (0, import_cryptography.toSerializedSignature)({
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
      publicKey: new import_ed25519.Ed25519PublicKey(publicKey),
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
//# sourceMappingURL=index.js.map
