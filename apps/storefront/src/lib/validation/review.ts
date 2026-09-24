import { z } from "zod";

export const submitReviewSchema = z.object({
  productId: z.string().min(1).max(200),
  name: z.string().trim().min(2, "Please enter your name").max(60, "Name is too long"),
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  comment: z.string().trim().max(1000, "Review is too long (1000 characters max)").optional().default(""),
  // Honeypot — real visitors never see or fill this field.
  website: z.string().max(200).optional(),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
