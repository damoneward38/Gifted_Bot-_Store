/**
 * Bot Checkout Service
 * Handles bot subscription purchases through PayPal
 */

import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { userBotPurchases, paypalSubscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../_core/logger";

// Bot pricing configuration
const BOT_PRICING = {
  branded: {
    monthly: 2999, // $29.99
    yearly: 29999, // $299.99
  },
  custom: {
    monthly: 1999, // $19.99
    yearly: 19999, // $199.99
  },
};

interface BotCheckoutRequest {
  botId: number;
  botType: "branded" | "custom";
  subscriptionType: "monthly" | "yearly";
  userId: string;
  userEmail: string;
}

interface CheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  message: string;
  paypalSubscriptionId?: string;
}

/**
 * Create a bot subscription checkout session
 * Returns PayPal approval URL for user authorization
 */
export async function createBotCheckout(
  request: BotCheckoutRequest
): Promise<CheckoutResponse> {
  // Convert userId to number if it's a string
  const userIdNum = typeof request.userId === 'string' ? parseInt(request.userId, 10) : request.userId;
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    // Get pricing
    const pricing = BOT_PRICING[request.botType];
    const amount =
      request.subscriptionType === "monthly" ? pricing.monthly : pricing.yearly;

    logger.info(
      `Creating bot checkout: Bot ${request.botId}, User ${request.userId}, Amount: $${(amount / 100).toFixed(2)}`
    );

    // Check if user already has this bot
    const existingPurchase = await db
      .select()
      .from(userBotPurchases)
      .where(
        and(
          eq(userBotPurchases.userId, userIdNum),
          eq(userBotPurchases.botId, request.botId)
        )
      );

    if (existingPurchase.length > 0) {
      const existing = existingPurchase[0];
      if (existing.status === "active" && existing.expiryDate && existing.expiryDate > new Date()) {
        return {
          success: false,
          message: "You already have an active subscription to this bot",
        };
      }
    }

    // In a real implementation, this would create a PayPal subscription
    // For now, we'll return a mock checkout URL
    const mockCheckoutUrl = `https://sandbox.paypal.com/checkoutnow?token=EC-MOCK-${request.botId}-${Date.now()}`;

    return {
      success: true,
      checkoutUrl: mockCheckoutUrl,
      message: "Checkout session created successfully",
    };
  } catch (error) {
    logger.error("Failed to create bot checkout:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create checkout session",
    });
  }
}

/**
 * Complete bot subscription after PayPal approval
 */
export async function completeBotSubscription(
  userId: string,
  botId: number,
  paypalSubscriptionId: string,
  subscriptionType: "monthly" | "yearly"
): Promise<{ success: boolean; message: string }> {
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    logger.info(
      `Completing bot subscription: User ${userId}, Bot ${botId}, PayPal Sub ${paypalSubscriptionId}`
    );

    // Calculate expiry date
    const expiryDate = new Date();
    if (subscriptionType === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Store PayPal subscription
    await db.insert(paypalSubscriptions).values({
      userId: userIdNum,
      paypalSubscriptionId,
      planId: "bot-subscription",
      tierId: 1,
      status: "active",
      createdAt: new Date(),
    });

    // Store bot purchase
    await db.insert(userBotPurchases).values({
      userId: userIdNum,
      botId,
      expiryDate,
      status: "active",
    });

    logger.info(`Bot subscription completed for user ${userId}`);

    return {
      success: true,
      message: "Bot subscription activated successfully",
    };
  } catch (error) {
    logger.error("Failed to complete bot subscription:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to complete subscription",
    });
  }
}

/**
 * Cancel bot subscription
 */
export async function cancelBotSubscription(
  userId: string,
  botId: number
): Promise<{ success: boolean; message: string }> {
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    logger.info(`Canceling bot subscription: User ${userId}, Bot ${botId}`);

    // Find the purchase
    const purchases = await db
      .select()
      .from(userBotPurchases)
      .where(
        and(
          eq(userBotPurchases.userId, userIdNum),
          eq(userBotPurchases.botId, botId),
          eq(userBotPurchases.status, "active")
        )
      );

    if (purchases.length === 0) {
      return {
        success: false,
        message: "No active subscription found",
      };
    }

    const purchase = purchases[0];

    // Update purchase status
    await db
      .update(userBotPurchases)
      .set({ status: "expired" })
      .where(eq(userBotPurchases.id, purchase.id));

    logger.info(`Bot subscription expired for user ${userId}`);

    return {
      success: true,
      message: "Bot subscription expired successfully",
    };
  } catch (error) {
    logger.error("Failed to cancel bot subscription:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to cancel subscription",
    });
  }
}

/**
 * Get bot subscription status
 */
export async function getBotSubscriptionStatus(
  userId: string,
  botId: number
): Promise<{
  hasSubscription: boolean;
  isActive: boolean;
  expiryDate?: Date | null;
}> {
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  try {
    const db = await getDb();
    if (!db) {
      return {
        hasSubscription: false,
        isActive: false,
      };
    }

    const purchases = await db
      .select()
      .from(userBotPurchases)
      .where(
        and(
          eq(userBotPurchases.userId, userIdNum),
          eq(userBotPurchases.botId, botId)
        )
      );

    if (purchases.length === 0) {
      return {
        hasSubscription: false,
        isActive: false,
      };
    }

    const purchase = purchases[0];
    const isActive =
      purchase.status === "active" && purchase.expiryDate !== null && purchase.expiryDate > new Date();

    return {
      hasSubscription: true,
      isActive: isActive || false,
      expiryDate: purchase.expiryDate,
    };
  } catch (error) {
    logger.error("Failed to get bot subscription status:", error);
    return {
      hasSubscription: false,
      isActive: false,
    };
  }
}
