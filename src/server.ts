import express from "express";
import {
  blake2AsU8a,
  signatureVerify,
  sr25519Verify,
} from "@polkadot/util-crypto";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import {
  decodePaymentHeader,
  RpcMap,
  sendAndWaitForFinalization,
  useApi,
  pubkeyOf,
} from "./utils";
import type {
  PaymentData,
  SettleOptions,
  SettleResult,
  VerifyResult,
} from "./types";

export const verifyWithApi =
  (api: any) => async (data: PaymentData): Promise<VerifyResult> => {
    const { transaction, signature } = data.payload;
    const signer = pubkeyOf(transaction.address);
    const hashOrRaw = (u8a: Uint8Array) =>
      u8a.length > 256 ? blake2AsU8a(u8a) : u8a;
    const rawUnsignedTransaction = api.registry.createType(
      "ExtrinsicPayload",
      transaction,
      {
        version: transaction.version,
      },
    );
    const unsignedPayload = hashOrRaw(rawUnsignedTransaction.toU8a({ method: true }));
    const result = signatureVerify(unsignedPayload, signature, signer);
    if (!result.isValid) {
      return {
        isValid: false,
        invalidReason: "bad signature",
      } as VerifyResult;
    }
    return {
      isValid: true,
      invalidReason: null,
    } as VerifyResult;
  };

export const settleWithApi = (api: any) =>
async (
  data: PaymentData,
  options: SettleOptions = {},
): Promise<SettleResult> => {
  const { transaction, signature } = data.payload;
  const signer = pubkeyOf(transaction.address);
  const { waitForFinalization = false } = options;

  const tx = api.tx(api.createType("Call", transaction.method))
    .addSignature(
      signer,
      signature,
      transaction,
    );

  let result: SettleResult = {
    txHash: null,
    success: false,
    message: null,
  };

  try {
    if (!waitForFinalization) {
      const txHash = await api.rpc.author.submitExtrinsic(tx);
      result.success = true;
      result.message = null;
      result.txHash = u8aToHex(txHash);
    } else {
      const { success, message, txHash } = await sendAndWaitForFinalization(
        tx,
      );
      result.success = success;
      result.message = message;
      result.txHash = txHash;
    }
  } catch (e: any) {
    console.log(e.message);
    result.success = false;
    result.message = e.message;
  }

  return result;
};
