import { z } from "zod";

export const couponSchema = z
  .object({
    code: z.string().min(2, "Required").max(30),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().int().min(1, "Must be more than 0"),
    minOrderAmount: z.number().int().min(0),
    maxRedemptions: z.number().int().min(1).optional().nullable(),
    startsAt: z.string().optional().or(z.literal("")), // yyyy-mm-dd
    expiresAt: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
  })
  .refine(
    (data) => data.discountType !== "percentage" || data.discountValue <= 100,
    { message: "A percentage discount can't exceed 100", path: ["discountValue"] },
  );

export type CouponInput = z.infer<typeof couponSchema>;
