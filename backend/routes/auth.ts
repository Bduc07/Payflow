import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { generateUniqueSlug } from "../lib/slug";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "email and password are required",
      });
    }

    const merchant = await prisma.merchant.findUnique({
      where: {
        email,
      },
    });

    // Same message whether the email is unknown, the account has no
    // password (Google-only signup), or the password is wrong - so we
    // don't leak which emails are registered or how they signed up.
    if (
      !merchant ||
      !merchant.passwordHash ||
      !(await bcrypt.compare(password, merchant.passwordHash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { merchantId: merchant.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Logged in successfully",
      token,
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        slug: merchant.slug,
        email: merchant.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (typeof credential !== "string" || !credential) {
      return res.status(400).json({ message: "credential is required" });
    }

    // Never trust the credential as-is - it arrived through the browser,
    // so we verify it's really a token Google issued before reading it,
    // the same "don't trust the client" rule as the Khalti/eSewa callbacks.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    let merchant = await prisma.merchant.findUnique({
      where: { googleId: payload.sub },
    });

    if (!merchant) {
      // No account linked to this Google ID yet - if the email already has
      // a password-based account, link Google to it instead of creating a
      // duplicate (the email column is unique, so a second create would
      // fail anyway). Otherwise, create a brand new merchant.
      const existingByEmail = await prisma.merchant.findUnique({
        where: { email: payload.email },
      });

      if (existingByEmail) {
        merchant = await prisma.merchant.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: payload.sub,
            profilePicture: payload.picture,
          },
        });
      } else {
        const businessName = payload.name ?? payload.email.split("@")[0];
        const slug = await generateUniqueSlug(businessName);

        merchant = await prisma.merchant.create({
          data: {
            businessName,
            slug,
            email: payload.email,
            googleId: payload.sub,
            profilePicture: payload.picture,
          },
        });
      }
    }

    const token = jwt.sign(
      { merchantId: merchant.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Logged in successfully",
      token,
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        slug: merchant.slug,
        email: merchant.email,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchantId },
    });

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    return res.status(200).json({
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        slug: merchant.slug,
        email: merchant.email,
      },
    });
  } catch (error) {
    console.error("Me error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

export default router;
