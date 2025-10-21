import { ApiPromise, WsProvider } from "@polkadot/api";
import type { AxiosInstance } from "axios";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import type {
  InjectedAccountWithMeta,
  KeyringPair,
  WalletKeypair,
} from "./types";
import { signWithKeypair } from "./client";
import { useApi } from "./utils";

import { web3FromAddress, web3Enable } from "@polkadot/extension-dapp";

// injected extension accounts don't have the sign() method, while keyring pairs do
const isKeyringPair = (x: any) => !!x.sign;

export async function signWithWeb3(
  keypair: WalletKeypair,
  unsignedTransaction: SignerPayloadJSON,
  api: ApiPromise,
): Promise<{ signature: string }> {
  await web3Enable("x402-vara");
  const injector = await web3FromAddress(keypair.address);
  if (!injector.signer || !injector.signer.signPayload) {
    throw new Error("No signer available from wallet");
  }
  return await injector.signer.signPayload(unsignedTransaction);
}

export async function signWithAuto(
  keypair: WalletKeypair,
  unsignedTransaction: SignerPayloadJSON,
  api: ApiPromise,
): Promise<{ signature: string }> {
  if (!isKeyringPair(keypair)) {
    return await signWithWeb3(keypair, unsignedTransaction, api);
  } else {
    return await signWithKeypair(keypair, unsignedTransaction, api);
  }
}
