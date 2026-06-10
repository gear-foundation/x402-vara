import { signatureVerify, blake2AsU8a, sr25519Verify } from 'npm:@polkadot/util-crypto';

// https://github.com/polkadot-js/api/blob/1c4c7c72e281da328084ae821218efb9fe7120ac/packages/types/src/extrinsic/util.ts
export const hashOrRaw = (u8a) => u8a.length > 256 ? blake2AsU8a(u8a) : u8a;

export async function createUnsignedTransaction(api, address, tx, options = {}) {
  const {
    eraPeriod = 64,
    tip = 0
  } = options;

  const lastHeader = await api.rpc.chain.getHeader();
  const blockHash = lastHeader.hash;
  const blockNumber = api.registry.createType(
    "BlockNumber",
    lastHeader.number.toNumber(),
  );
  const method = api.createType("Call", tx);

  const era = api.registry.createType("ExtrinsicEra", {
    current: lastHeader.number.toNumber(),
    period: eraPeriod,
  });

  const nonce = await api.rpc.system.accountNextIndex(address);

  const unsignedTransaction = {
    specVersion: api.runtimeVersion.specVersion.toHex(),
    transactionVersion: api.runtimeVersion.transactionVersion.toHex(),
    address: address,
    blockHash: blockHash.toHex(),
    blockNumber: blockNumber.toHex(),
    era: era.toHex(),
    genesisHash: api.genesisHash.toHex(),
    method: method.toHex(),
    nonce: nonce.toHex(),
    signedExtensions: api.registry.signedExtensions,
    tip: api.registry.createType("Compact<Balance>", tip).toHex(),
    version: tx.version,
  };

  return unsignedTransaction;
}
