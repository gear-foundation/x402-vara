import { ApiPromise, WsProvider } from "@polkadot/api";
import type { AxiosInstance } from "axios";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import type {
  InjectedAccountWithMeta,
  KeyringPair,
  WalletKeypair,
} from "./types";
import { paymentHeader } from "./utils";

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
          const { accepts } = error.response.data;
          const header = await paymentHeader(accepts[0], keypair, signWith);
          const originalConfig = error.config;
          originalConfig.headers["X-PAYMENT"] = header;
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
