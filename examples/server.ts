import { requirePayment } from "x402-vara/express";
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Configuration from environment variables
const payTo = process.env.ADDRESS ||
  "kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW";
const network = process.env.NETWORK || "vara-testnet";
const port = parseInt(process.env.PORT || "3001");
const facilitator = process.env.FACILITATOR_URL;

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.set("json spaces", 2);

// Free endpoint - health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    config: {
      network,
      payTo,
      facilitator,
    },
  });
});

// Paid endpoint - one-time access/payment ($0.10)
app.get(
  "/api/pay/hello",
  requirePayment({
    price: "100000000000",
    description: "Example paid access to a GET endpoint",
    network,
    payTo,
    facilitator,
  }),
  (req, res) => {
    const txHash = res.get("X-PAYMENT-RESPONSE");

    res.json({
      hello: "world",
      txHash,
    });
  },
);

app.listen(port, () => {
  console.log(`
🚀 x402 Payment Template Server (Express)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Accepting payments to: ${payTo}
🔗 Network: ${network}
🌐 Port: ${port}
🖥️ Facilitator: ${facilitator ?? "(built-in)"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Payment Options:
   - /api/pay/hello Price per request: 0.10 VARA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️  This is a template! Customize it for your app.
📚 Learn more: https://x402.org
💬 Get help: https://discord.gg/invite/cdp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
