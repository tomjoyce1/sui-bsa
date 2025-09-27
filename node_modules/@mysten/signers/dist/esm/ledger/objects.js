import { SuiMoveObject } from "./bcs.js";
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
    return SuiMoveObject.serialize({
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
export {
  getInputObjects
};
//# sourceMappingURL=objects.js.map
