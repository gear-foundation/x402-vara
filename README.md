# x402-vara

x402 payment protocol implementation for Vara Network

[![npm version](https://img.shields.io/npm/v/x402-vara.svg)](https://www.npmjs.com/package/x402-vara)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
bun i x402-vara
```

## Usage

### Server-side (Express)

```typescript
import { requirePayment } from 'x402-vara/express';

// Use the payment middleware
app.get('/api/pay/premium',
  requirePayment({
    price: "100000000000",
    description: "Premium content access (0.10 VARA)",
    network: "vara-testnet",
    payTo: "your-vara-address",
  }),
  (req, res) => {
    res.json({ message: "Access granted!" });
  }
);
```

### Server-side (Next.js)

```typescript
import { paymentMiddleware } from "x402-vara/next";

// Configure protected routes and their payment requirements
export const middleware = paymentMiddleware(
  process.env.PAYMENT_RECIPIENT_ADDRESS!,
  {
    "/api/protected/weather": [
      {
        price: "1000000",
        asset: "0xAssetProgramId...",
        network: "vara-testnet",
        config: {
          description: "Access to weather data API (pay in VFT token)",
          extra: {
            name: "WUSDC",
            decimals: 6,
          },
        },
      },
    ],
  },
  {
    // Facilitator URL is REQUIRED for x402 protocol
    url: process.env.FACILITATOR_URL!,
  },
);
```

### Facilitator (optional)

You can directly use the public facilitator for testing purposes:

```
FACILITATOR_URL=https://x402-vara-next-facilitator.up.railway.app/api/facilitator
```

Or run your own instance by cloning [varazone/x402-vara-next-facilitator](https://github.com/varazone/x402-vara-next-facilitator)

Note: the facilitator service connects to remote RPC nodes via WebSocket. However, Some serverless providers like Vercel do not support persistent WS connections. So make sure you deploy it on a platform with good support for WebSocket.

### Client-side (Axios)

```typescript
import { withX402Interceptor } from 'x402-vara/client';
import axios from 'axios';

// Create axios instance with x402 payment interceptor
const apiClient = withX402Interceptor(axios.create(), keypair);

// Make requests - payment will be handled automatically
const response = await apiClient.get('http://localhost:3001/api/pay/premium');
```

## Used by

- https://github.com/varazone/x402-vara-next-demo
- https://github.com/varazone/x402-vara-next-facilitator
- https://github.com/varazone/x402-vara-express-demo

## API Reference

### Server Exports

- `requirePayment(options)` - Express middleware for payment verification
- `facilitatorRouter` - Express router for payment facilitator endpoints
- `decodePaymentHeader(header)` - Decode x402 payment headers
- `useApi(network)` - Get Polkadot.js API instance for Vara network

### Client Exports

- `withX402Interceptor(axiosInstance, walletClient)` - Axios interceptor for automatic payments
- `createUnsignedTransaction(api, address, tx)` - Create unsigned transaction
- `signWith(keypair, unsignedTransaction, api)` - Sign transaction with wallet
- `useApi(network)` - Get Polkadot.js API instance for Vara network

## License

MIT
