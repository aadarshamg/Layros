import { z } from "zod";

// India-only for v1 (see plan §2.10, §5) — a 6-digit PIN code, no leading zero.
const indianPostalCode = /^[1-9][0-9]{5}$/;

export const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z
    .string()
    .regex(indianPostalCode, "Enter a valid 6-digit PIN code"),
  country: z.literal("IN"),
});

export const giftWrapSchema = z.object({
  enabled: z.boolean(),
  message: z.string().max(200, "Gift message must be 200 characters or fewer").optional(),
  forLineItemId: z.string().optional(),
});

export const checkoutDetailsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number")
    .optional()
    .or(z.literal("")),
  createAccount: z.boolean().default(false),
  shippingAddress: addressSchema,
  shippingMethodId: z.string().min(1, "Select a shipping method"),
  giftWrap: giftWrapSchema.optional(),
  newsletterOptIn: z.boolean().default(false),
});

export const checkoutPaymentSchema = z
  .object({
    billingSameAsShipping: z.boolean(),
    billingAddress: addressSchema.optional(),
    paymentProviderId: z.string().min(1, "Select a payment method"),
    promoCode: z.string().optional(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms and Privacy Policy" }),
    }),
  })
  .refine((data) => data.billingSameAsShipping || !!data.billingAddress, {
    message: "Billing address is required",
    path: ["billingAddress"],
  });

export type CheckoutDetailsInput = z.infer<typeof checkoutDetailsSchema>;
export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>;
