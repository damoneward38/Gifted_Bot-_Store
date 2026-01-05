import { db } from "../db";
import { contentMasterPurchases } from "../../drizzle/schema";

export async function handlePayPalWebhook(event: any) {
  if (!db) throw new Error("DB not initialized");

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const purchase = event.resource;

    await db.insert(contentMasterPurchases).values({
      userId: Number(purchase.custom_id),
      planType: purchase.description,
      amount: Number(purchase.amount.value),
      status: "completed",
      createdAt: new Date(),
    });
  }

  return { received: true };
}
