// src/services/stripe/stripe.service.ts
import Stripe from "stripe";
import { db } from "../../config/firebase";
import { UserService } from "../user/user.service";

export class StripeService {
  private stripe: Stripe;
  private userService: UserService;
  private readonly TOKENS_PER_DOLLAR = 10000; // 10,000 tokens per $1

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });

    this.userService = new UserService();
  }

  async createCheckoutSession(
    userId: string,
    tokenAmount: number
  ): Promise<string> {
    try {
      // Calculate price in cents (Stripe uses cents)
      const amountInCents = Math.ceil(
        (tokenAmount / this.TOKENS_PER_DOLLAR) * 100
      );

      // Minimum purchase amount
      if (amountInCents < 100) {
        // $1 minimum
        throw new Error("Minimum token purchase is 10,000 tokens ($1)");
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "API Tokens",
                description: `${tokenAmount} tokens for your account`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          userId,
          tokenAmount: tokenAmount.toString(),
        },
      });

      // Store session information in database for verification
      await db.collection("stripe_sessions").doc(session.id).set({
        userId,
        tokenAmount,
        sessionId: session.id,
        status: "pending",
        createdAt: new Date(),
      });

      return session.url || "";
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    try {
      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );

      // Handle the event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Verify session in our database
        const sessionDoc = await db
          .collection("stripe_sessions")
          .doc(session.id)
          .get();

        if (!sessionDoc.exists) {
          throw new Error(`Session ${session.id} not found in database`);
        }

        const sessionData = sessionDoc.data();

        if (!sessionData || sessionData.status !== "pending") {
          throw new Error(`Invalid session status for ${session.id}`);
        }

        const userId = sessionData.userId;
        const tokenAmount = Number(sessionData.tokenAmount);

        // Update user tokens with transaction
        await this.addTokensToUser(userId, tokenAmount);

        // Update session status
        await db.collection("stripe_sessions").doc(session.id).update({
          status: "completed",
          processedAt: new Date(),
        });

        // Save purchase history
        await db.collection("token_purchases").add({
          userId,
          tokenAmount,
          amountPaid: (session.amount_total || 0) / 100, // Convert from cents to dollars
          stripeSessionId: session.id,
          purchaseDate: new Date(),
        });
      }
    } catch (error) {
      console.error("Error handling webhook:", error);
      throw error;
    }
  }

  private async addTokensToUser(
    userId: string,
    tokenAmount: number
  ): Promise<void> {
    const userRef = db.collection("users").doc(userId);

    try {
      // Use transaction to safely update token balance
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error(`User ${userId} not found`);
        }

        const userData = userDoc.data();
        const currentTokens = userData?.availableTokens || 0;

        transaction.update(userRef, {
          availableTokens: currentTokens + tokenAmount,
        });
      });
    } catch (error) {
      console.error("Error adding tokens to user:", error);
      throw error;
    }
  }

  async getPurchaseHistory(userId: string): Promise<any[]> {
    try {
      const purchasesSnapshot = await db
        .collection("token_purchases")
        .where("userId", "==", userId)
        .orderBy("purchaseDate", "desc")
        .get();

      return purchasesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting purchase history:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
