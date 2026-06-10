import { ApiPromise, WsProvider } from "npm:@polkadot/api";
import { createTestPairs } from "npm:@polkadot/keyring";
import { KeyringPair } from "npm:@polkadot/keyring/types";
import { EXTRINSIC_VERSION } from "npm:@polkadot/types/extrinsic/v4/Extrinsic";
import { signatureVerify } from "npm:@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "npm:@polkadot/util";
import { hashOrRaw } from "./utils.mjs";

// 1. Initialize Polkadot API
// const wsProvider = new WsProvider("wss://rpc.polkadot.io");
// const wsProvider = new WsProvider("wss://rpc.vara.network");
const wsProvider = new WsProvider("wss://testnet.vara.network");
const api = await ApiPromise.create({ provider: wsProvider });

const { unsignedTransaction, signature, signer } = JSON.parse(
  Deno.readTextFileSync("data.json"),
);

const rawUnsignedTransaction = api.registry.createType(
  "ExtrinsicPayload",
  unsignedTransaction,
  {
    version: unsignedTransaction.version,
  },
);
const payload = hashOrRaw(rawUnsignedTransaction.toU8a({ method: true }));

// validate
const result = signatureVerify(payload, signature, signer);

console.log(result);

// restore serialized tx
// const tx = api.createType("Extrinsic", tx.toHex());
const tx = api.tx(api.createType("Call", unsignedTransaction.method))
  .addSignature(
    signer,
    signature,
    unsignedTransaction,
    // rawUnsignedTransaction,
  );

// const dryRunResult = await api.rpc.system.dryRun(tx.toHex());
// console.log(dryRunResult.toHuman());
// console.log(tx.send)

console.log(tx.hash.toHex());

async function sendAndWaitForFinalization1(tx) {
  return new Promise(async (resolve, reject) => {
    const txHash = tx.hash.toHex();

    const unsub = await tx.send(({ status, events }) => {
      if (status.isFinalized) {
        let success = false;

        // Inspect events to detect success or failure
        for (const { event } of events) {
          const { section, method, data } = event;
          if (section === "system") {
            if (method === "ExtrinsicSuccess") {
              success = true;
              break;
            } else if (method === "ExtrinsicFailed") {
              success = false;
              break;
            }
          }
        }

        unsub(); // stop listening
        resolve({
          txHash,
          success,
          events,
          blockHash: status.asFinalized.toHex(),
        });
      }
    }).catch(reject);
  });
}

async function sendAndWaitForFinalization(tx) {
  return new Promise(async (resolve, reject) => {
    const txHash = tx.hash.toHex();

    const unsub = await tx.send(({ status, events }) => {
      if (status.isFinalized) {
        let success = false;
        let message: string | null = null;

        // Inspect events
        for (const { event } of events) {
          const { section, method, data } = event;

          if (section === "system") {
            if (method === "ExtrinsicSuccess") {
              success = true;
              message = "Extrinsic executed successfully";
              break;
            } else if (method === "ExtrinsicFailed") {
              success = false;
              const [dispatchError] = data.toJSON();

              if (dispatchError?.Module) {
                // If it’s a module error, get pallet name and error
                const { index, error } = dispatchError.Module;
                message = `Module error: index ${index}, error ${error}`;
              } else if (dispatchError?.token) {
                message = `Dispatch error: ${JSON.stringify(dispatchError)}`;
              } else {
                message = `Dispatch error: ${dispatchError}`;
              }

              break;
            }
          }
        }

        unsub(); // stop listening
        resolve({
          txHash,
          success,
          message,
          blockHash: status.asFinalized.toHex(),
        });
      }
    }).catch(reject);
  });
}

{
  let result = {
    txHash: null,
    success: false,
    message: null,
    blockHash: null,
  };

  try {
    // const txHash = await api.rpc.author.submitExtrinsic(tx);
    // console.log("txHash:", u8aToHex(txHash));
    result = await sendAndWaitForFinalization(tx);
  } catch (e) {
    console.log(e.message);
    result.success = false;
    result.message = e.message;
  } finally {
    console.log(result);
    Deno.exit();
  }
}
