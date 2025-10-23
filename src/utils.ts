import { ApiPromise, WsProvider } from "@polkadot/api";
import { GearApi } from '@gear-js/api';
import { z } from "zod";
import type { PaymentData } from "./types";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
import { VftProgram } from "@/lib/vft";

export function pubkeyOf(addr: string): `0x${string}` {
  if (addr.startsWith("0x")) {
    return addr as `0x${string}`;
  }
  return u8aToHex(decodeAddress(addr));
}

export async function balanceOf(
  api: any,
  address: string,
  asset?: `0x${string}`,
): Promise<bigint> {
  if (asset) {
    const pubkey = pubkeyOf(address);
    const vft = new VftProgram(api, asset);
    const vftBalance = await vft.vft.balanceOf(pubkey).call();
    return vftBalance;
  } else {
    const { data } = await api.query.system.account(address);
    const freeBalance = data.free.toBigInt();
    return freeBalance;
  }
}

export const RpcMap: Record<string, string> = {
  "vara": "wss://rpc.vara.network",
  "vara-testnet": "wss://testnet.vara.network",
};

const API = new Map<string, ApiPromise>();

export async function useApi(network: string): Promise<ApiPromise> {
  const oldApi = API.get(network);

  if (oldApi && oldApi.isConnected) {
    return oldApi;
  }

  if (oldApi && !oldApi.isConnected) {
    try {
      oldApi.disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
    API.delete(network);
  }

  const rpc = RpcMap[network];
  if (!rpc) {
    throw new Error(`No RPC endpoint configured for network: ${network}`);
  }

  const api = await GearApi.create({ providerAddress: rpc })
  await api.isReady;
  API.set(network, api);

  return api;
}

export interface TransactionResult {
  txHash: string | null;
  blockHash: string | null;
  success: boolean;
  message: string | null;
}

export async function sendAndWaitForFinalization(
  tx: any,
): Promise<TransactionResult> {
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
