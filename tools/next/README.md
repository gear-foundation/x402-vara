# x402-vara next

direct HTTP request got 402 response

```
curl localhost:3000/api/protected/weather | jq .
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "vara-testnet",
      "maxAmountRequired": "1000000000000",
      "resource": "http://localhost:3000/api/protected/weather",
      "description": "Access to weather data API (pay in native token)",
      "mimeType": "application/json",
      "outputSchema": null,
      "payTo": "kGkX45btdCz3y1gE5QkD2vBGAzjinUHq9C2wPaCT44s6CU5Tx",
      "maxTimeoutSeconds": 60,
      "extra": null
    },
    {
      "scheme": "exact",
      "network": "vara-testnet",
      "maxAmountRequired": "1000000",
      "resource": "http://localhost:3000/api/protected/weather",
      "description": "Access to weather data API (pay in VFT token)",
      "mimeType": "application/json",
      "outputSchema": null,
      "payTo": "kGkX45btdCz3y1gE5QkD2vBGAzjinUHq9C2wPaCT44s6CU5Tx",
      "asset": "0x64f9def5a6da5a2a847812d615151a88f8c508e062654885267339a8bf29e52f",
      "maxTimeoutSeconds": 60,
      "extra": {
        "name": "WUSDC",
        "decimals": 6
      }
    }
  ]
}
```

request weather

```
curl localhost:3344/api/protected/weather -H "X-PAYMENT: $( env NETWORK=vara-testnet AMOUNT=1000000000000 PAY_TO=kGkX45btdCz3y1gE5QkD2vBGAzjinUHq9C2wPaCT44s6CU5Tx bun next-x-payment.ts | base64 -w 0)" | jq .
```
