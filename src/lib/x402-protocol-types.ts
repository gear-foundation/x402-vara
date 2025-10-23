/**
 * Official x402 Protocol Type Definitions
 * Based on: https://github.com/coinbase/x402
 */

/**
 * Payment Required Response (402 response body)
 */
export interface PaymentRequiredResponse {
  /** Version of the x402 payment protocol */
  x402Version: number;
  
  /** List of payment requirements that the resource server accepts */
  accepts: PaymentRequirements[];
  
  /** Error message (optional) */
  error?: string;
}

/**
 * Payment Requirements
 */
export interface PaymentRequirements {
  /** Scheme of the payment protocol to use (e.g., "exact") */
  scheme: string;
  
  /** Network of the blockchain to send payment on (e.g., "testnet", "mainnet") */
  network: string;
  
  /** Maximum amount required to pay for the resource in atomic units */
  maxAmountRequired: string;
  
  /** URL of resource to pay for */
  resource: string;
  
  /** Description of the resource */
  description: string;
  
  /** MIME type of the resource response */
  mimeType: string;
  
  /** Output schema of the resource response (optional) */
  outputSchema?: object | null;
  
  /** Address to pay value to */
  payTo: string;
  
  /** Asset used for payment */
  asset?: `0x${string}`;

  /** Maximum time in seconds for the resource server to respond */
  maxTimeoutSeconds: number;
  
  /** Extra information about the payment details specific to the scheme */
  extra?: object | null;
}

/**
 * Payment Payload (X-PAYMENT header content, base64 encoded JSON)
 */
export interface PaymentPayload {
  /** Version of the x402 payment protocol */
  x402Version: number;
  
  /** Scheme value of the accepted paymentRequirements */
  scheme: string;
  
  /** Network id of the accepted paymentRequirements */
  network: string;
  
  /** Asset of the accepted paymentRequirements */
  asset?: `0x${string}`;

  /** Scheme-dependent payload (for the "exact" scheme: signature and transaction separately) */
  payload: {
    /** Base64 encoded BCS signature (AccountAuthenticator) */
    signature: string;
    /** Base64 encoded BCS transaction (RawTransaction) */
    transaction: any;
  };
}

/**
 * Facilitator /verify endpoint request
 */
export interface VerifyRequest {
  /** Version of the x402 payment protocol */
  x402Version: number;

  /** The X-PAYMENT header value (base64 encoded PaymentPayload) */
  paymentHeader: string;

  /** The payment requirements being verified against */
  paymentRequirements: PaymentRequirements;
}

/**
 * Facilitator /verify endpoint response
 */
export interface VerifyResponse {
  /** Whether the payment is valid */
  isValid: boolean;
  
  /** Reason for invalidity (if isValid is false) */
  invalidReason: string | null;
}

/**
 * Facilitator /settle endpoint request
 */
export interface SettleRequest {
  /** Version of the x402 payment protocol */
  x402Version: number;
  
  /** The X-PAYMENT header value (base64 encoded PaymentPayload) */
  paymentHeader: string;
  
  /** The payment requirements being settled */
  paymentRequirements: PaymentRequirements;
}

/**
 * Facilitator /settle endpoint response
 */
export interface SettleResponse {
  /** Whether the payment was successful */
  success: boolean;
  
  /** Error message from the facilitator server (if success is false) */
  error: string | null;
  
  /** Transaction hash of the settled payment */
  txHash: string | null;
  
  /** Network id of the blockchain the payment was settled on */
  networkId: string | null;
}

/**
 * X-PAYMENT-RESPONSE header content (base64 encoded JSON)
 */
export interface PaymentResponseHeader {
  /** Settlement response from facilitator */
  settlement: SettleResponse;
}

// Constants
export const X402_VERSION = 1;
export const X402_SCHEME = "exact";

// Vara-specific network identifiers
export const VARA_MAINNET = "vara";
export const VARA_TESTNET = "vara-testnet";
export const validVaraNetworks = [VARA_TESTNET, VARA_MAINNET];
