import { ApiPromise, WsProvider } from "@polkadot/api";
import type { AxiosInstance } from "axios";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import {
  web3FromAddress,
} from "@polkadot/extension-dapp";
import type { WalletKeypair } from "./types";
import { useApi } from "./utils";

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

export async function signWith(
  keypair: WalletKeypair,
  unsignedTransaction: SignerPayloadJSON,
  api: ApiPromise,
): Promise<{ signature: string }> {
  if ("meta" in keypair) {
    const injector = await web3FromAddress(keypair.address);
    if (!injector.signer || !injector.signer.signPayload) {
      throw new Error("No signer available from wallet");
    }
    return await injector.signer.signPayload(unsignedTransaction);
  } else {
    const rawUnsignedTransaction = api.registry.createType(
      "ExtrinsicPayload",
      unsignedTransaction,
      {
        version: unsignedTransaction.version,
      },
    );
    return rawUnsignedTransaction.sign(keypair);
  }
}

export function withX402Interceptor(
  axiosClient: AxiosInstance,
  keypair: WalletKeypair,
): AxiosInstance {
  axiosClient.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response) {
        if (error.response.status === 402) {
          let { accepts } = error.response.data;
          let { network, price, resource, payTo, facilitator } = accepts[0];
          let amount = Number(price.amount) * 1e12;
          let api = await useApi(network);
          const tx = api.tx.balances.transferKeepAlive(payTo, amount);
          const unsignedTransaction = await createUnsignedTransaction(
            api,
            keypair.address,
            tx,
          );
          const { signature } = await signWith(
            keypair,
            unsignedTransaction,
            api,
          );
          const data = {
            unsignedTransaction,
            signature,
            signer: keypair.address,
            network,
          };
          const paymentHeader = btoa(JSON.stringify(data));
          const originalConfig = error.config;
          originalConfig.headers["X-PAYMENT"] = paymentHeader;
          originalConfig.headers["Access-Control-Expose-Headers"] =
            "X-PAYMENT-RESPONSE";
          const secondResponse = await axiosClient.request(originalConfig);
          return secondResponse;
        }
      } else if (error.request) {
        console.error("No response from server:", error.request);
      } else {
        console.error("Axios setup error:", error.message);
      }

      return Promise.reject(error);
    },
  );
  return axiosClient;
}
