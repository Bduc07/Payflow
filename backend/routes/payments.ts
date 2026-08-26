import express from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma";

const router = express.Router();

const KHALTI_BASE_URL = "https://dev.khalti.com/api/v2/epayment";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

router.post("/khalti/initiate", async (req, res) => {
  try {
    const { merchantSlug, amount } = req.body;

    if (typeof merchantSlug !== "string" || !merchantSlug.trim()) {
      return res.status(400).json({ message: "merchantSlug is required" });
    }

    if (typeof amount !== "number" || amount < 10) {
      return res.status(400).json({
        message: "amount is required and must be at least Rs 10",
      });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
    });

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    const khaltiRes = await fetch(`${KHALTI_BASE_URL}/initiate/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        return_url: `${BACKEND_URL}/api/payments/khalti/callback`,
        website_url: FRONTEND_URL,
        amount: Math.round(amount * 100),
        purchase_order_id: crypto.randomUUID(),
        purchase_order_name: `Payment to ${merchant.businessName}`,
      }),
    });

    const khaltiData = await khaltiRes.json();

    if (!khaltiRes.ok) {
      console.error("Khalti initiate error:", khaltiData);
      return res.status(502).json({
        message: "Could not start Khalti payment",
      });
    }

    await prisma.transaction.create({
      data: {
        merchantId: merchant.id,
        amount,
        paymentMethod: "khalti",
        status: "pending",
        pidx: khaltiData.pidx,
      },
    });

    return res.status(200).json({ payment_url: khaltiData.payment_url });
  } catch (error) {
    console.error("Khalti initiate error:", error);

    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/khalti/callback", async (req, res) => {
  const pidx = req.query.pidx;

  if (typeof pidx !== "string") {
    return res.redirect(`${FRONTEND_URL}/?payment=error`);
  }

  try {
    const lookupRes = await fetch(`${KHALTI_BASE_URL}/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const lookupData = await lookupRes.json();

    if (!lookupRes.ok) {
      console.error("Khalti lookup error:", lookupData);
      return res.redirect(`${FRONTEND_URL}/?payment=error`);
    }

    // Only Khalti's own lookup response decides the outcome here -
    // never the query params on this redirect, which anyone could fake.
    const status: string =
      lookupData.status === "Completed"
        ? "success"
        : ["Pending", "Initiated"].includes(lookupData.status)
        ? "pending"
        : "failed";

    const transaction = await prisma.transaction.findUnique({
      where: { pidx },
      include: { merchant: true },
    });

    if (!transaction) {
      return res.redirect(`${FRONTEND_URL}/?payment=error`);
    }

    await prisma.transaction.update({
      where: { pidx },
      data: { status },
    });

    return res.redirect(
      `${FRONTEND_URL}/pay/${transaction.merchant.slug}?payment=${status}`
    );
  } catch (error) {
    console.error("Khalti callback error:", error);

    return res.redirect(`${FRONTEND_URL}/?payment=error`);
  }
});

export default router;
