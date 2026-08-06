import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Pick a rating").max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z.string().min(1, "Say a little about your experience").max(2000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
