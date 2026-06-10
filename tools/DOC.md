Client:
- HTTP Client equipped with middleware with a Crypto Wallet (KeyringPair)
- checks 402 status
- on success or non 402 errors:
  return response
- on 402 error:
  X-PAYMENT header

Server:
- HTTP Server equipped with middleware that
- checks X-PAYMENT header
- on success:
  verify && settle transaction
- on failure:
  return 402 status with accepted payment method info

Facilitator:
- /verify
- /settle
