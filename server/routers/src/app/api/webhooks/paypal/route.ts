import { handlePayPalWebhook } from "@/server/webhooks/paypal";

export async function POST(req: Request) {
  const body = await req.json();
  await handlePayPalWebhook(body);
  return Response.json({ ok: true });
}
