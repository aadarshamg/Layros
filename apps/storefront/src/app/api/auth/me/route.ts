import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer, getSessionCustomerId } from "@/lib/auth/session";
import { updateProfile, patchDefaultAddress } from "@/lib/auth/customers";
import { addressSchema } from "@/lib/validation/checkout";
import { z } from "zod";

export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json({ customer });
}

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  marketingOptIn: z.boolean().optional(),
  defaultShippingAddress: addressSchema.optional(),
});

export async function PATCH(request: NextRequest) {
  const customerId = await getSessionCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const { name, email, marketingOptIn, defaultShippingAddress } = parsed.data;
  if (name !== undefined || email !== undefined || marketingOptIn !== undefined) {
    await updateProfile(customerId, { name, email: email || undefined, marketingOptIn });
  }
  if (defaultShippingAddress) {
    await patchDefaultAddress(customerId, defaultShippingAddress);
  }

  const customer = await getCurrentCustomer();
  return NextResponse.json({ customer });
}
