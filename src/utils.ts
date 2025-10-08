import { ApiPromise, WsProvider } from "@polkadot/api";
import { z } from "zod";
import type { PaymentData } from "./types";
import type { SignerPayloadJSON } from "@polkadot/types/types";

export const RpcMap: Record<string, string> = {
  "vara": "wss://rpc.vara.network",
  "vara-testnet": "wss://testnet.vara.network",
};

const API = new Map<string, ApiPromise>();

export async function useApi(network: string): Promise<ApiPromise> {
  if (!API.get(network)) {
    const rpc = RpcMap[network];
    const provider = new WsProvider(rpc);
    const api = await ApiPromise.create({ provider });
    API.set(network, api);
  }
  return API.get(network)!;
}

export async function sendAndWaitForFinalization(tx: any) {
  return new Promise(async (resolve, reject) => {
    const txHash = tx.hash.toHex();

    const unsub = await tx.send(
      ({ status, events }: { status: any; events: any[] }) => {
        if (status.isFinalized) {
          let success = false;
          let message: string | null = null;

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

          unsub();
          resolve({
            txHash,
            success,
            message,
            blockHash: status.asFinalized.toHex(),
          });
        }
      },
    ).catch(reject);
  });
}

const PaymentDataSchema = z.object({
  unsignedTransaction: z.any(),
  signature: z.string(),
  signer: z.string(),
  network: z.enum(["vara", "vara-testnet"]),
});

export function decodePaymentHeader(x: string): PaymentData | null {
  if (!x) return null;

  const decoded = atob(x);
  const parsed = JSON.parse(decoded);
  const data = PaymentDataSchema.parse(parsed);

  return data as PaymentData;
}

export async function createUnsignedTransaction(
  api: ApiPromise,
  address: string,
  tx: any,
  options: { eraPeriod?: number; tip?: number } = {},
): Promise<SignerPayloadJSON> {
  const {
    eraPeriod = 64,
    tip = 0,
  } = options;

  const lastHeader = await api.rpc.chain.getHeader();
  const blockHash = lastHeader.hash;
  const blockNumber = api.registry.createType(
    "BlockNumber",
    lastHeader.number.toNumber(),
  );
  const method = api.createType("Call", tx);

  const era = api.registry.createType("ExtrinsicEra", {
    current: lastHeader.number.toNumber(),
    period: eraPeriod,
  });

  const nonce = await api.rpc.system.accountNextIndex(address);

  const unsignedTransaction = {
    specVersion: api.runtimeVersion.specVersion.toHex(),
    transactionVersion: api.runtimeVersion.transactionVersion.toHex(),
    address: address,
    blockHash: blockHash.toHex(),
    blockNumber: blockNumber.toHex(),
    era: era.toHex(),
    genesisHash: api.genesisHash.toHex(),
    method: method.toHex(),
    nonce: nonce.toHex(),
    signedExtensions: api.registry.signedExtensions,
    tip: api.registry.createType("Compact<Balance>", tip).toHex(),
    version: tx.version,
  };

  return unsignedTransaction;
}
