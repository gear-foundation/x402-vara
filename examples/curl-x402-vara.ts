import { useApi } from "x402-vara";
import { createTestPairs } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import axios from "axios";
import type { AxiosInstance } from "axios";
import { withX402Interceptor } from "x402-vara/client";

const targetUrl = Bun.argv[2];

if (!targetUrl) {
  console.error(`Usage: bun ${Bun.argv[1]} <url>`);
  process.exit(1);
}

// 0. Get the keypairs
const testKeypairs: KeyringPair[] = Object.values(createTestPairs());
const alice = testKeypairs[1];

// 1. Base axios instance without payment interceptor
const baseApiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Create x402Client from keypair and base api client
const x402Client: AxiosInstance = withX402Interceptor(baseApiClient, alice);

// 3. Make the request
const response = await x402Client.get(targetUrl);
console.log(response.data);

process.exit(0);
