import { createTestPairs } from "npm:@polkadot/keyring";
import { KeyringPair } from "npm:@polkadot/keyring/types";

const testKeypairs: KeyringPair[] = Object.values(createTestPairs());
