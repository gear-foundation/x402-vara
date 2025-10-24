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
} from "./utils";
import type { PaymentData, PaymentOptions, SettleResult } from "./types";
import { settleWithApi, verifyWithApi } from "./server";

/**
 * requirePayment middleware for x402 payment verification and submission
 */
export function requirePayment(options: PaymentOptions) {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const {
      enabled = true,
      extra = null,
      price,
      asset,
      description,
      network,
      payTo,
      facilitator,
    } = options;

    if (!enabled) {
      next();
      return;
    }

    const payload = req.headers["x-payment"] as string;

    if (!payload) {
      const resource = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      res.status(402).json({
        x402Version: 1,
        accepts: [{
          scheme: "exact",
          description,
          resource,
          network,
          maxAmountRequired: price,
          asset,
          payTo,
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
          outputSchema: null,
          extra,
        }],
      });
      return;
    }

    const data = decodePaymentHeader(payload);

    const { verify, settle, supported } = await useFacilitator({
      network,
      facilitator,
    });
    if (!supported) {
      res.status(400).json({
        error: "Bad request",
        message: `Unsupported network: ${network}`,
      });
      return;
    }

    if (!data) {
      res.status(400).json({
        error: "Bad request",
        message: "Invalid payment data",
      });
      return;
    }

    const { isValid, message, status } = await verify!(data);
    if (!isValid) {
      res.status(status ?? 403).json({
        error: "Verification error",
        message: `Error verifying X-PAYMENT header: ${message}`,
      });
      return;
    }

    const result = await settle!(data);

    if (!result.success) {
      res.status(result.status ?? 403).json({
        error: "Settlement error",
        message: result.message,
      });
      return;
    }

    res.set("X-PAYMENT-RESPONSE", result.txHash);

    next();
  };
}

export async function useFacilitator(
  { network, facilitator }: { network: string; facilitator?: string },
) {
  if (!RpcMap[network]) return { supported: false };

  const api = await useApi(network);

  const verifyRemotely = async (data: PaymentData) => {
    const res = await fetch(`${facilitator}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      return { message: `facilitator ${res.status}`, status: 502 };
    }
    const json = await res.json();
    return json;
  };

  const settleRemotely = async (data: PaymentData) => {
    const res = await fetch(`${facilitator}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      return { message: `facilitator ${res.status}`, status: 502 };
    }
    const json = await res.json();
    return json;
  };

  const verifyLocally = verifyWithApi(api);
  const settleLocally = settleWithApi(api);

  return {
    supported: true,
    verify: facilitator ? verifyRemotely : verifyLocally,
    settle: facilitator ? settleRemotely : settleLocally,
  };
}

export const facilitatorRouter = express.Router();

facilitatorRouter.post("/verify", async (req, res) => {
  const { network } = req.body;
  if (!RpcMap[network]) {
    res.status(400).json({
      error: "Bad request",
      message: `Unsupported network: ${network}`,
    });
    return;
  }

  const api = await useApi(network);
  const result = await verifyWithApi(api)(req.body);
  res.json(result);
});

facilitatorRouter.post("/settle", async (req, res) => {
  const { network } = req.body;
  if (!RpcMap[network]) {
    res.status(400).json({
      error: "Bad request",
      message: `Unsupported network: ${network}`,
    });
    return;
  }

  const api = await useApi(network);
  const result = await settleWithApi(api)(req.body);
  res.json(result);
});
