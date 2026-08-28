import express from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: req.merchantId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        paymentMethod: tx.paymentMethod,
        status: tx.status,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error("List transactions error:", error);

    return res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
