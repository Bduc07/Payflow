import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth";
import paymentsRoutes from "./routes/payments";
import merchantsRoutes from "./routes/merchants";
import transactionsRoutes from "./routes/transactions";

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PayFlow backend is running");
});

app.get("/api/merchants/count", async (req, res) => {
  try {
    const count = await prisma.merchant.count();

    res.json({ count });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Could not connect to database",
    });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/merchants", merchantsRoutes);
app.use("/api/transactions", transactionsRoutes);

app.listen(PORT, () => {
  console.log(`PayFlow backend running on port ${PORT}`);
});
