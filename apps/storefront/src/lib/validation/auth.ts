import { z } from "zod";

// Same 10-digit Indian mobile pattern used in checkout.ts — no country code, no leading +91.
const indianPhone = /^[6-9]\d{9}$/;

export const requestOtpSchema = z.object({
  phone: z.string().regex(indianPhone, "Enter a valid 10-digit phone number"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(indianPhone, "Enter a valid 10-digit phone number"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
