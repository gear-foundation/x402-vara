import type { SignerPayloadJSON } from "@polkadot/types/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export type VaraNetwork = "vara" | "vara-testnet";

export interface PaymentData {
  unsignedTransaction: SignerPayloadJSON;
  signature: string;
  signer: string;
  network: VaraNetwork;
}

export interface PaymentOptions {
  enabled?: boolean;
  price: { amount: string; asset: string };
  description: string;
  network: VaraNetwork;
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