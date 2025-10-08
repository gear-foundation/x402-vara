import type { SignerPayloadJSON } from "@polkadot/types/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export interface PaymentData {
  unsignedTransaction: SignerPayloadJSON;
  signature: string;
  signer: string;
  network: string;
}

export interface PaymentOptions {
  enabled?: boolean;
  price: { amount: string; asset: string };
  description: string;
  network: string;
  payTo: string;
  facilitator?: string;
}

export interface TransactionResult {
  txHash: string | null;
  success: boolean;
  message: string | null;
  blockHash: string | null;
}

export type WalletKeypair = KeyringPair | InjectedAccountWithMeta;
export { InjectedAccountWithMeta, KeyringPair };
