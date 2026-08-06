"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { message, accountMember } from "@/shared/db/schema";
import { getShopById } from "@/features/app/stores/server/queries";
import { getResendClient, fromAddressForShop } from "@/features/app/notifications/server/resend";
import { siteConfig } from "@/shared/config/site";
import { createMessageSchema, type CreateMessageInput } from "./schema";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Powers both the platform-wide /contact form and a store's public
 * "message this store" form (shopId present). Always stores the message
 * first — email delivery is fire-and-forget on top, same pattern as order
 * notifications, so a Resend outage never loses the enquiry itself.
 */
export async function createMessage(
  input: CreateMessageInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { senderName, senderEmail, subject, body, shopId } = parsed.data;

  const [created] = await db
    .insert(message)
    .values({
      shopId: shopId || null,
      senderName,
      senderEmail,
      subject: subject || null,
      body,
    })
    .returning();

  await notifyRecipient(created.id, { senderName, senderEmail, subject, body, shopId });

  return { success: true, data: { id: created.id } };
}

async function notifyRecipient(
  messageId: string,
  input: { senderName: string; senderEmail: string; subject?: string; body: string; shopId?: string },
) {
  try {
    const resend = getResendClient();

    if (input.shopId) {
      const shop = await getShopById(input.shopId);
      if (!shop) return;

      const owner = await db.query.accountMember.findFirst({
        where: eq(accountMember.accountId, input.shopId),
        with: { role: { columns: { name: true } }, user: { columns: { email: true } } },
      });
      const ownerEmail = owner?.role.name === "Owner" ? owner.user.email : null;
      if (!ownerEmail) return;

      await resend.emails.send({
        from: fromAddressForShop(shop.name),
        to: ownerEmail,
        subject: `New message: ${input.subject || "(no subject)"}`,
        text: `From: ${input.senderName} <${input.senderEmail}>\n\n${input.body}`,
      });
    } else {
      await resend.emails.send({
        from: `${siteConfig.name} <${process.env.RESEND_FROM_EMAIL || "hello@resend.dev"}>`,
        to: siteConfig.contactEmail,
        subject: `New contact form message: ${input.subject || "(no subject)"}`,
        text: `From: ${input.senderName} <${input.senderEmail}>\n\n${input.body}`,
      });
    }
  } catch (err) {
    // Never let a notification-email failure surface to the person who
    // just submitted the form — their message is already saved.
    console.error("[createMessage] notification email failed:", messageId, err);
  }
}

export async function markMessageRead(
  accountId: string,
  messageId: string,
): Promise<ActionResult> {
  await db
    .update(message)
    .set({ isRead: true })
    .where(eq(message.id, messageId));
  return { success: true, data: undefined };
}

export async function listMessagesForShop(shopId: string) {
  return db.query.message.findMany({
    where: eq(message.shopId, shopId),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });
}
