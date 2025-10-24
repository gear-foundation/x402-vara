import type { SignerPayloadJSON } from "@polkadot/types/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

export interface PaymentData {
  x402Version: number;
  scheme: string;
  network: string;
  asset?: `0x${string}`;
  payload: {
    transaction: SignerPayloadJSON,
    signature: string,
  };
}

export interface PaymentOptions {
  enabled?: boolean;
  asset?: `0x${string}`;
  price: string;
  description: string;
  network: string;
  payTo: string;
  facilitator?: string;
  extra?: object | null;
}

export interface SettleOptions {
  waitForFinalization?: boolean;
}

export interface SettleResult {
  txHash: string | null;
  success: boolean;
  message: string | null;
}

export interface VerifyResult {
  isValid: boolean;
  invalidReason: string | null;
}

export type WalletKeypair = KeyringPair | InjectedAccountWithMeta;
export { InjectedAccountWithMeta, KeyringPair };
