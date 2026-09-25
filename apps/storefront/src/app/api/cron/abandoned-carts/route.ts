import { NextRequest, NextResponse } from "next/server";
import { timingSafeStringEqual } from "@/lib/auth/crypto";
import { validateCoupon } from "@/lib/checkout/coupons";
import { recoveryClient, type StoredCart } from "@/lib/cart-recovery/store";
import { sendCartReminder, isWhatsAppCartConfigured } from "@/lib/cart-recovery/whatsapp";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 40;

interface RecoverySettings {
  enabled?: boolean;
  delayMinutes?: number;
  secondHours?: number;
  coupon1?: string;
  coupon2?: string;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return timingSafeStringEqual(header, `Bearer ${secret}`);
}

// Marketing messages only between 9am and 9pm India time.
function isQuietHoursInIndia(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(now));
  return hour < 9 || hour >= 21;
}

function productList(items: StoredCart["items"]) {
  const parts = items.map((item) => {
    const title = item.title.split("|")[0].trim();
    const squash = (text: string) => text.toLowerCase().replace(/\s+/g, "");
    const showSize = item.sizeLabel && !squash(title).includes(squash(item.sizeLabel));
    return `${title}${showSize ? ` (${item.sizeLabel})` : ""}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`;
  });
  const joined = parts.slice(0, 4).join(", ");
  return parts.length > 4 ? `${joined} and ${parts.length - 4} more` : joined;
}

async function closingLine(couponCode: string | undefined, cartTotal: number) {
  if (couponCode) {
    const result = await validateCoupon(couponCode, cartTotal);
    if (result.valid && result.coupon) {
      const offer = result.coupon.discountType === "percent" ? `${result.coupon.discountValue}% off` : `₹${result.coupon.discountValue} off`;
      return `Use code ${result.coupon.code} for ${offer} your order.`;
    }
  }
  return "We've saved your bag for you.";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!recoveryClient) return NextResponse.json({ error: "Sanity write token not configured" }, { status: 503 });

  const now = new Date();
  const settings =
    (await recoveryClient.fetch<RecoverySettings | null>(
      `*[_id == "storeSettings"][0]{
        "enabled": cartRecoveryEnabled,
        "delayMinutes": cartReminderDelayMinutes,
        "secondHours": cartSecondReminderHours,
        "coupon1": cartReminderCoupon1,
        "coupon2": cartReminderCoupon2
      }`,
    )) ?? {};

  // Carts idle for over a week are no longer worth a nudge.
  const staleBefore = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const expired = await recoveryClient.fetch<string[]>(`*[_type == "abandonedCart" && status == "active" && updatedAt < $staleBefore]._id`, { staleBefore });
  for (const id of expired) await recoveryClient.patch(id).set({ status: "expired" }).commit();

  if (!settings.enabled) return NextResponse.json({ ok: true, skipped: "reminders are switched off in Store Settings", expired: expired.length });
  if (isQuietHoursInIndia(now)) return NextResponse.json({ ok: true, skipped: "quiet hours (9pm–9am IST)", expired: expired.length });

  const delayMinutes = settings.delayMinutes ?? 60;
  const secondHours = settings.secondHours ?? 24;
  const firstDueBefore = new Date(now.getTime() - delayMinutes * 60 * 1000).toISOString();
  const secondDueBefore = new Date(now.getTime() - secondHours * 60 * 60 * 1000).toISOString();

  const due = await recoveryClient.fetch<StoredCart[]>(
    `*[_type == "abandonedCart" && status == "active" && consent == true && count(items) > 0 && updatedAt > $staleBefore && (
        (coalesce(remindersSent, 0) == 0 && updatedAt < $firstDueBefore && (!defined(lastRemindedAt) || lastRemindedAt < $staleBefore)) ||
        ($secondEnabled && remindersSent == 1 && lastRemindedAt < $secondDueBefore)
      )] | order(updatedAt asc) [0...$max] {_id, phone, name, status, items, cartTotal, updatedAt, remindersSent, lastRemindedAt, restoreToken}`,
    { staleBefore, firstDueBefore, secondDueBefore, secondEnabled: secondHours > 0, max: MAX_PER_RUN },
  );

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leyros.in").replace(/\/$/, "");
  const results: { phone: string; reminder: number; result: string }[] = [];

  for (const cart of due) {
    // Belt and braces: skip anyone who has ordered since this cart last changed.
    const ordered = await recoveryClient.fetch<string | null>(
      `*[_type == "order" && (customerPhone == $phone || customer._ref == $customerId) && _createdAt > $since][0].orderNumber`,
      { phone: cart.phone, customerId: `customer-${cart.phone}`, since: cart.updatedAt },
    );
    if (ordered) {
      await recoveryClient.patch(cart._id).set({ status: "converted", convertedOrderNumber: ordered }).commit();
      results.push({ phone: `…${cart.phone.slice(-4)}`, reminder: 0, result: "already ordered" });
      continue;
    }

    const reminderNumber = (cart.remindersSent ?? 0) + 1;
    const send = await sendCartReminder({
      phone: cart.phone,
      name: cart.name || "there",
      products: productList(cart.items),
      closingLine: await closingLine(reminderNumber === 1 ? settings.coupon1 : settings.coupon2, cart.cartTotal ?? 0),
      restoreToken: cart.restoreToken,
      restoreUrl: `${siteUrl}/r/${cart.restoreToken}`,
    });
    const outcome = send.ok ? (send.mode === "sent" ? "sent" : "logged only (no WhatsApp provider connected)") : `failed: ${send.error}`;
    await recoveryClient
      .patch(cart._id)
      .set({ remindersSent: reminderNumber, lastRemindedAt: now.toISOString(), lastReminderResult: `Reminder ${reminderNumber}: ${outcome}` })
      .commit();
    results.push({ phone: `…${cart.phone.slice(-4)}`, reminder: reminderNumber, result: outcome });
  }

  return NextResponse.json({ ok: true, whatsappConnected: isWhatsAppCartConfigured(), expired: expired.length, processed: results.length, results });
}
