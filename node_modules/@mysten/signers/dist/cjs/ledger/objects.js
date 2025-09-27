"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var objects_exports = {};
__export(objects_exports, {
  getInputObjects: () => getInputObjects
});
module.exports = __toCommonJS(objects_exports);
var import_bcs = require("./bcs.js");
const getInputObjects = async (transaction, client) => {
  const data = transaction.getData();
  const gasObjectIds = data.gasData.payment?.map((object) => object.objectId) ?? [];
  const inputObjectIds = data.inputs.map((input) => {
    return input.$kind === "Object" && input.Object.$kind === "ImmOrOwnedObject" ? input.Object.ImmOrOwnedObject.objectId : null;
  }).filter((objectId) => !!objectId);
  const objects = await client.multiGetObjects({
    ids: [...gasObjectIds, ...inputObjectIds],
    options: {
      showBcs: true,
      showPreviousTransaction: true,
      showStorageRebate: true,
      showOwner: true
    }
  });
  const bcsObjects = objects.map((object) => {
    if (object.error || !object.data || object.data.bcs?.dataType !== "moveObject") {
      return null;
    }
    return import_bcs.SuiMoveObject.serialize({
      data: {
        MoveObject: {
          type: object.data.bcs.type,
          hasPublicTransfer: object.data.bcs.hasPublicTransfer,
          version: object.data.bcs.version,
          contents: object.data.bcs.bcsBytes
        }
      },
      owner: object.data.owner,
      previousTransaction: object.data.previousTransaction,
      storageRebate: object.data.storageRebate
    }).toBytes();
  }).filter((bcsBytes) => !!bcsBytes);
  return { bcsObjects };
};
//# sourceMappingURL=objects.js.map
