import { z } from "zod";

export const createMessageSchema = z.object({
  senderName: z.string().min(1, "Required").max(100),
  senderEmail: z.string().email("Enter a valid email"),
  subject: z.string().max(150).optional().or(z.literal("")),
  body: z.string().min(10, "Tell us a bit more").max(2000),
  // Present when the message is sent from a specific store's public page
  // rather than the platform-wide /contact page.
  shopId: z.string().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
