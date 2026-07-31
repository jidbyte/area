// These names must exactly match APPROVED templates in Meta's WhatsApp
// Manager (Business Settings -> WhatsApp Manager -> Message Templates).
// Meta's Cloud API cannot send free-form text to someone who hasn't
// messaged you in the last 24 hours — a proactive notification like an
// order confirmation MUST go through an approved template, not plain text.
//
// Submit both templates with category "Utility" (transactional), not
// "Marketing" — Utility templates are reviewed faster and billed
// differently. Review can take anywhere from minutes to about a day, so
// this won't work until both are approved.

export const WHATSAPP_TEMPLATE_ORDER_CONFIRMATION_BUYER =
  "order_confirmation_buyer";
// Body to submit for approval (numbered placeholders, in this exact order):
//   "Hi {{1}}, your order {{2}} from {{3}} is confirmed. Total: {{4}} {{5}}.
//    We'll be in touch about delivery."
// Params sent, in order: buyerName, saleNumber, shopName, currency, total

export const WHATSAPP_TEMPLATE_NEW_ORDER_SHOP_OWNER = "new_order_shop_owner";
// Body to submit for approval:
//   "New order {{1}} from {{2}} for {{3}} {{4}}. Buyer contact: {{5}}.
//    View it in your AREA dashboard."
// Params sent, in order: saleNumber, buyerName, currency, total, buyerPhone

export const WHATSAPP_LANGUAGE_CODE = "en_US";
