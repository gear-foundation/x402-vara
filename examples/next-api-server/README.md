This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, configure the payment recipient address and facilitator api url:

```
PAYMENT_RECIPIENT_ADDRESS=...
FACILITATOR_URL=...
```

or use default values from `env.example`:

```bash
$ cp env.example .env.local
```

Run the development server:
```
$ bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/api/protected/weather/route.js`. The page auto-updates as you edit the file.

The x402 middleware is defined in `proxy.js`, you can customize the payment network, price and protected routes like this

```
// Configure protected routes and their payment requirements
export const proxy = paymentMiddleware(
  process.env.PAYMENT_RECIPIENT_ADDRESS,
  {
    "/api/protected/weather": [
      {
        price: "1000000000000",
        network: "vara-testnet",
        config: {
          description: "Access to weather data API (pay in native token)",
        },
      },
      {
        price: "1000000",
        asset: "0x64f9def5a6da5a2a847812d615151a88f8c508e062654885267339a8bf29e52f",
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
    url: process.env.FACILITATOR_URL,
  },
);

export const config = {
  matcher: ['/api/protected/:path*'],
};
```
