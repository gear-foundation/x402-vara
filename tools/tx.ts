import { ApiPromise, WsProvider } from "npm:@polkadot/api";
import { createTestPairs } from "npm:@polkadot/keyring";
import { KeyringPair } from "npm:@polkadot/keyring/types";
import { EXTRINSIC_VERSION } from "npm:@polkadot/types/extrinsic/v4/Extrinsic";
import {
  blake2AsU8a,
  signatureVerify,
  sr25519Verify,
} from "npm:@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "npm:@polkadot/util";
import { createUnsignedTransaction, hashOrRaw } from "./utils.mjs";

// 0. Get the keypairs
const testKeypairs: KeyringPair[] = Object.values(createTestPairs());

const alice = testKeypairs[1];
const bob = testKeypairs[2];

// 1. Initialize Polkadot API
// const wsProvider = new WsProvider("wss://rpc.polkadot.io");
// const wsProvider = new WsProvider("wss://rpc.vara.network");
const wsProvider = new WsProvider("wss://testnet.vara.network");
const api = await ApiPromise.create({ provider: wsProvider });

// construct the tx
// const tx = api.tx.system.remark("WC");
const tx = api.tx.balances.transferKeepAlive(alice.address, 1 * 1e12);

// v4
console.log(EXTRINSIC_VERSION, tx.version);

console.log(tx.toHuman());
console.log(tx.toString());
console.log(tx.toHex());

const unsignedTransaction = await createUnsignedTransaction(
  api,
  u8aToHex(alice.publicKey),
  tx,
);
// const unsignedTransaction = await createUnsignedTransaction(api, alice.address, tx);

console.log({ unsignedTransaction });

// client: signature generation

// create the extrinsic payload using the unsigned transaction
// https://docs.reown.com/advanced/multichain/polkadot/dapp-integration-guide#adding-the-signature-to-the-extrinsicpayload
// https://aandds.com/blog/polkadot-tx.html
// https://learnblockchain.cn/article/8534
const rawUnsignedTransaction = api.registry.createType(
  "ExtrinsicPayload",
  unsignedTransaction,
  {
    version: unsignedTransaction.version,
  },
);
const payload = hashOrRaw(rawUnsignedTransaction.toU8a({ method: true }));

let sig = u8aToHex(alice.sign(payload, { withType: true }));
console.log("payload signature:", sig);

const signed = rawUnsignedTransaction.sign(alice);
const { signature } = signed;

console.log("rawUnsignedTransaction", rawUnsignedTransaction.toHuman());
console.log("rawUnsignedTransaction", rawUnsignedTransaction.toJSON());

// client: send tx(hex), unsigned payload, signature

const data = {
  network: "vara-testnet",
  unsignedTransaction,
  signature: sig,
  signer: alice.address,
};
Deno.writeTextFileSync("data.json", JSON.stringify(data, null, "  "));

console.log("data written to data.json");
Deno.exit();
