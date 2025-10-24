import { createTestPairs } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import {
  blake2AsU8a,
  signatureVerify,
  sr25519Verify,
} from "@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { createUnsignedTransaction, useApi } from "x402-vara/utils";
import { signWithKeypair } from "x402-vara/client";

const network = process.env.NETWORK;
const amount = process.env.AMOUNT;
const payTo = process.env.PAY_TO;

if (!network || !amount || !payTo) {
  console.error("failed to load env vars: NETWORK/AMOUNT/PAY_TO");
  process.exit(1);
}

// 0. Get the keypairs
const testKeypairs: KeyringPair[] = Object.values(createTestPairs());
const alice = testKeypairs[1];

// 1. Initialize Polkadot API
const api = await useApi(network);

// construct the tx
const tx = api.tx.balances.transferKeepAlive(payTo, amount);

const unsignedTransaction = await createUnsignedTransaction(
  api,
  u8aToHex(alice.publicKey),
  tx,
);

const { signature } = await signWithKeypair(
  alice,
  unsignedTransaction,
  api,
);

const data = {
  x402Version: 1,
  schema: "exact",
  network: "vara-testnet",
  payload: {
    transaction: unsignedTransaction,
    signature,
  },
};

console.log(JSON.stringify(data, null, "  "));
process.exit();
