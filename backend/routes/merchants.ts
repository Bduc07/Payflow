import express from "express";
import { prisma } from "../lib/prisma";

const router = express.Router();

router.get("/:slug", async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { slug: req.params.slug },
    });

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    return res.status(200).json({
      merchant: {
        businessName: merchant.businessName,
        slug: merchant.slug,
      },
    });
  } catch (error) {
    console.error("Get merchant error:", error);

    return res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
