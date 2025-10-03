# x402-vara

x402 payment protocol implementation for Vara Network

## Installation

```bash
npm install x402-vara
# or
bun add x402-vara
```

## Usage

### Server-side (Express)

```typescript
import { requirePayment, facilitatorRouter } from 'x402-vara/server';

// Use the payment middleware
app.get('/api/pay/premium',
  requirePayment({
    price: {
      amount: "1.00",
      asset: "VARA",
    },
    description: "Premium content access",
    network: "vara-testnet",
    payTo: "your-vara-address",
  }),
  (req, res) => {
    res.json({ message: "Access granted!" });
  }
);

// Use facilitator router if needed
app.use('/api/facilitator', facilitatorRouter);
```

### Client-side (React/Axios)

```typescript
import { withX402Interceptor } from 'x402-vara/client';
import axios from 'axios';

// Create axios instance with x402 payment interceptor
const apiClient = withX402Interceptor(axios.create(), walletClient);

// Make requests - payment will be handled automatically
const response = await apiClient.get('/api/pay/premium');
```

## Used by

- https://github.com/varazone/x402-vara-demo

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
