# x402-vara scripts

## server.ts

Start a local express server with routes:

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
   - /api/pay/hello-vft Price per request: 0.10 WUSDC
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

## x-payment-json.ts

Request the paid route with signed x-payment header, got protected resource behind paywall:

```
$ PAYMENT_HEADER="$(env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW bun x-payment-json.ts | base64 -w 0)"
$ curl localhost:3001/api/pay/hello -H "X-PAYMENT: $PAYMENT_HEADER"
{
  "hello": "world",
  "txHash": "0x749ff0cd5c4e181bf22cb777d3c63370bc9555a067a60d8cdbc2abd7c5d87328"
}
```

You can use `curl -I` to print the headers only`

```
$ PAYMENT_HEADER="$(env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW bun x-payment-json.ts | base64 -w 0)"
$ curl -I localhost:3001/api/pay/hello -H "X-PAYMENT: $PAYMENT_HEADER"
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Date: Tue, 07 Oct 2025 19:30:55 GMT
Content-Length: 104
ETag: W/"68-pP4NScUIyoltbBLgatBMh1Qt/5c"
X-Powered-By: Express
X-PAYMENT-RESPONSE: 0xb262c664b0e7ef43bb3e99ff6d24babea938a3f612dc3e37f284fdf746767804
```

It's almost the same with VFT payment, except you need to specify the token program address via `ASSET=0x...`

```
$ PAYMENT_HEADER="$(env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW ASSET=0x64f9def5a6da5a2a847812d615151a88f8c508e062654885267339a8bf29e52f bun x-payment-json.ts | base64 -w 0)"
$ curl -I localhost:3001/api/pay/hello-vft -H "X-PAYMENT: $PAYMENT_HEADER"
...
```

Under the hood, `x-payment-json.ts` produces a json payload with signature like the following, which will be base64 encoded later and sent via the `X-PAYMENT` header:

```
$ env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW bun x-payment-json.ts
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "vara-testnet",
  "payload": {
    "transaction": {
      "specVersion": "0x00000780",
      "transactionVersion": "0x00000001",
      "address": "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",
      "blockHash": "0xef05845f28c81aed22de5ade250a9fa24926a9f792dd23db480d6f537f4340d0",
      "blockNumber": "0x014cfcc2",
      "era": "0x2500",
      "genesisHash": "0x525639f713f397dcf839bd022cd821f367ebcf179de7b9253531f8adbe5436d6",
      "method": "0x050300d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0700e8764817",
      "nonce": "0x00007c6a",
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
    "signature": "0x017ec1a3f2c322ed7e44a447baf727b8bed821e329044be45e213957d0273fc8301c9a8134752d1ff58db958a9dc6437fec981fb2513e9b43b6d666694138c738a"
  }
}
```

## curl-x402-vara.ts

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

Caveat: currently curl-x402-vara.ts doesn't support specifying the paying asset.

When there are multiple acceptable payment options, it will always pick the first.

For example, the following resource can be paid in VARA, and WUSDC token. The script will always choose the option.

```
$ bun curl-x402-vara.ts https://x402-vara-next-demo.up.railway.app/api/protected/weather
...
```

## Calling the facilitator API

The base64 encoded x-payment header will be sent to facilitator for verification and settlement. That process is handled by the middleware on the server side.

To demonstrate how to call the /verify and /settle endpoints by hand, we first construct the `PAYMENT_HEADER` string

This time we use the VFT token `ASSET=0x...` for payment instead of the native VARA token:

```
$ PAYMENT_HEADER="$(env NETWORK=vara-testnet AMOUNT=100000000000 PAY_TO=kGfXzQ99jakxFMQEox9iQYQ6zfMkwScJTScuPLSovqxjPbkXW ASSET=0x64f9def5a6da5a2a847812d615151a88f8c508e062654885267339a8bf29e52f bun x-payment-json.ts | base64 -w 0)"
ewogIC...==
```

Now let's construct the request payload and save it to `/tmp/payload.json`
```
$ curl -sL https://x402-vara-next-demo.up.railway.app/api/protected/weather | jq --arg header "$PAYMENT_HEADER" '{
    x402Version,
    paymentHeader: $header,
    paymentRequirements: .accepts[1]
}' | tee /tmp/payload.json
{
  "x402Version": 1,
  "paymentHeader": "ewogIC...==",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "vara-testnet",
    "maxAmountRequired": "1000000000000",
    "resource": "https://localhost:8000/api/protected/weather",
    "description": "Access to weather data API (pay in native token)",
    "mimeType": "application/json",
    "outputSchema": null,
    "payTo": "kGfXzQ99jakxFMQEox9iQYQ6zfMkwScJTScuPLSovqxjPbkXW",
    "maxTimeoutSeconds": 60l
    "extra": null
  }
}
```

Then we can send it to the /verify endpoint:

```
$ curl -sL https://x402-vara-next-demo.up.railway.app/api/facilitator/verify -d @/tmp/payload.json | jq .
{
  "isValid": true,
  "invalidReason": null
}
```

and settle it:

```
$ curl -sL https://x402-vara-next-demo.up.railway.app/api/facilitator/settle -d @/tmp/payload.json | jq .
{
  "success": true,
  "error": null,
  "txHash": "0xf2cb5111283581181caa217dff4d8f33e9fb290426520fb6e92088eeba953a9d",
  "networkId": "vara-testnet"
}
```

If you verify the same payload again, it will still appear valid. but when you settle it again, you are expected to get this error:

```
{
  "success": false,
  "error": "1012: Transaction is temporarily banned",
  "txHash": null,
  "networkId": null
}
```
