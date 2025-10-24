# x402-vara examples

Start a local server with routes:

- /api/health free endpoint
- /api/pay/hello paywalled endpoint

```
$ PORT=3001 bun server.ts 

🚀 x402 Payment Template Server (Express)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Accepting payments to: kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW
🔗 Network: vara-testnet
🌐 Port: 3001
🖥️ Facilitator: (built-in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Payment Options:
   - /api/pay/hello Price per request: 0.10 VARA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️  This is a template! Customize it for your app.
📚 Learn more: https://x402.org
💬 Get help: https://discord.gg/invite/cdp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
GET /api/health 200 2.377 ms - 169
GET /api/pay/hello 402 0.806 ms - 405
```

Request the free route:

```
$ curl localhost:3001/api/health 
{
  "status": "ok",
  "message": "Server is running",
  "config": {
    "network": "vara-testnet",
    "payTo": "kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW"
  }
}
```

Request the paid route directly, got error response with status 402:

```
$ curl localhost:3001/api/pay/hello
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "description": "Example paid access to a GET endpoint",
      "resource": "http://localhost:3001/api/pay/hello",
      "network": "vara-testnet",
      "maxAmountRequired": "100000000000",
      "payTo": "kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW",
      "mimeType": "application/json",
      "maxTimeoutSeconds": 60,
      "outputSchema": null,
      "extra": null
    }
  ]
}
```

Request the paid route with signed x-payment header, got protected response behind paywall:

```
$ curl localhost:3001/api/pay/hello -H "X-PAYMENT: $(env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW bun x-payment.ts | base64 -w 0)"
{
  "hello": "world",
  "txHash": "0x749ff0cd5c4e181bf22cb777d3c63370bc9555a067a60d8cdbc2abd7c5d87328"
}
```

You can use `curl -I` to print the headers only`

```
$ curl -I localhost:3001/api/pay/hello -H "X-PAYMENT: $(env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW bun x-payment.ts | base64 -w 0)"
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Date: Tue, 07 Oct 2025 19:30:55 GMT
Content-Length: 104
ETag: W/"68-pP4NScUIyoltbBLgatBMh1Qt/5c"
X-Powered-By: Express
X-PAYMENT-RESPONSE: 0xb262c664b0e7ef43bb3e99ff6d24babea938a3f612dc3e37f284fdf746767804
```

Under the hood, `x-payment.ts` produces a json payload with signature like this:

```
$ env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW bun x-payment.ts
{
  "network": "vara-testnet",
  "unsignedTransaction": {
    "specVersion": "0x00000780",
    "transactionVersion": "0x00000001",
    "address": "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
    "blockHash": "0x74d014f3303007763ba656b65f28846a953e3ec69fd4a11973291d95ced3d6a6",
    "blockNumber": "0x0145bfcc",
    "era": "0xc500",
    "genesisHash": "0x525639f713f397dcf839bd022cd821f367ebcf179de7b9253531f8adbe5436d6",
    "method": "0x050300d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0700e8764817",
    "nonce": "0x00007b25",
    "signedExtensions": [
      "StakingBlackList",
      "CheckNonZeroSender",
      "CheckSpecVersion",
      "CheckTxVersion",
      "CheckGenesis",
      "CheckMortality",
      "CheckNonce",
      "CheckWeight",
      "ChargeTransactionPayment",
      "CheckMetadataHash"
    ],
    "tip": "0x00000000000000000000000000000000",
    "version": 4
  },
  "signature": "0x0198a0712d396197c0684056ad795b5f4ae4bcc39e3734cf9f964fd3504e5bbd257c8f4aca2ebded1719719d5e2adb349f5b52cc5dfec4c5c380153964c186528e",
  "signer": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
} 
```

To make things easier, use `curl-x402-vara.ts` to add the x-payment header automatically

```
$ bun curl-x402-vara.ts http://localhost:3001/api/pay/hello
{
  hello: "world",
  txHash: "0xa2696b2fa1d974ff6effa59739174bcab0621aff6bf36e5d80bc405f74a2b027",
}
```

It uses the `withX402Interceptor` axios interceptor to handle 402 errors, and it works for unprotected resources too

```
$ bun curl-x402-vara.ts http://localhost:3001/api/health
{
  status: "ok",
  message: "Server is running",
  config: {
    network: "vara-testnet",
    payTo: "kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW",
  },
}
```
