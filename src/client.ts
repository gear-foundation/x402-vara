import { ApiPromise, WsProvider } from "@polkadot/api";
import type { AxiosInstance } from "axios";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import type {
  InjectedAccountWithMeta,
  KeyringPair,
  WalletKeypair,
} from "./types";
import { createUnsignedTransaction, useApi } from "./utils";

export async function signWithKeypair(
  keypair: WalletKeypair,
  unsignedTransaction: SignerPayloadJSON,
  api: ApiPromise,
): Promise<{ signature: string }> {
  const rawUnsignedTransaction = api.registry.createType(
    "ExtrinsicPayload",
    unsignedTransaction,
    {
      version: unsignedTransaction.version,
    },
  );
  return rawUnsignedTransaction.sign(keypair as KeyringPair);
}

export function withX402Interceptor(
  axiosClient: AxiosInstance,
  keypair: WalletKeypair,
  signWith = signWithKeypair,
): AxiosInstance {
  axiosClient.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      if (error.response) {
        if (error.response.status === 402) {
          let { accepts } = error.response.data;
          let { network, maxAmountRequired, resource, payTo, facilitator } = accepts[0];
          let api = await useApi(network);
          const tx = api.tx.balances.transferKeepAlive(payTo, maxAmountRequired);
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
            x402Version: 1,
            scheme: "exact",
            payload: {
              transaction: unsignedTransaction,
              signature,
            },
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
