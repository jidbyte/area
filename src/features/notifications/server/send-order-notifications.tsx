import { getSaleById } from "@/features/sales/server/queries";
import { getShopById } from "@/features/shops/server/queries";
import { getResendClient, fromAddressForShop } from "./resend";
import { OrderConfirmationBuyerEmail } from "../emails/order-confirmation-buyer";
import { NewOrderShopOwnerEmail } from "../emails/new-order-shop-owner";
import { sendWhatsAppTemplate } from "@/shared/lib/whatsapp";
import { normalizePhoneForWhatsApp } from "@/shared/utils/phone";
import {
  WHATSAPP_TEMPLATE_ORDER_CONFIRMATION_BUYER,
  WHATSAPP_TEMPLATE_NEW_ORDER_SHOP_OWNER,
  WHATSAPP_LANGUAGE_CODE,
} from "@/shared/config/whatsapp";

/**
 * Fire-and-forget by design: a notification failing should never undo or
 * block a successful, already-paid order. Every send is independently
 * wrapped so any one channel/recipient failing doesn't stop the others,
 * and any failure here just logs — it never throws back to the checkout
 * flow that called it.
 */
export async function sendOrderNotifications(saleId: string): Promise<void> {
  const sale = await getSaleById(saleId);
  if (!sale) {
    console.error("[sendOrderNotifications] sale not found:", saleId);
    return;
  }

  const shop = await getShopById(sale.shopId);
  if (!shop) {
    console.error("[sendOrderNotifications] shop not found for sale:", saleId);
    return;
  }

  const items = sale.items.map((item) => ({
    name: item.productName,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const buyerEmail = sale.customer?.email;
  const buyerPhone = sale.customer?.phone;

  if (buyerEmail) {
    try {
      const resend = getResendClient();
      await resend.emails.send({
        from: fromAddressForShop(shop.name),
        to: buyerEmail,
        subject: `Order confirmed — ${sale.saleNumber}`,
        react: OrderConfirmationBuyerEmail({
          shopName: shop.name,
          buyerName: sale.customerName,
          saleNumber: sale.saleNumber,
          currency: shop.currency,
          items,
          total: sale.totalAmount,
        }),
      });
    } catch (err) {
      console.error("[sendOrderNotifications] buyer email failed:", err);
    }
  }

  if (shop.email) {
    try {
      const resend = getResendClient();
      await resend.emails.send({
        from: fromAddressForShop(shop.name),
        to: shop.email,
        subject: `New order: ${sale.saleNumber}`,
        react: NewOrderShopOwnerEmail({
          shopSlug: shop.slug,
          saleNumber: sale.saleNumber,
          saleId: sale.id,
          buyerName: sale.customerName,
          buyerEmail: sale.customer?.email ?? "—",
          buyerPhone: sale.customer?.phone ?? "—",
          currency: shop.currency,
          items,
          total: sale.totalAmount,
          appUrl,
        }),
      });
    } catch (err) {
      console.error("[sendOrderNotifications] shop owner email failed:", err);
    }
  } else {
    console.error(
      "[sendOrderNotifications] shop has no contact email set:",
      shop.id,
    );
  }

  if (buyerPhone) {
    try {
      const normalized = normalizePhoneForWhatsApp(buyerPhone, shop.currency);
      if (!normalized) {
        console.error(
          "[sendOrderNotifications] buyer phone didn't normalize:",
          buyerPhone,
        );
      } else {
        const result = await sendWhatsAppTemplate({
          to: normalized,
          templateName: WHATSAPP_TEMPLATE_ORDER_CONFIRMATION_BUYER,
          languageCode: WHATSAPP_LANGUAGE_CODE,
          bodyParams: [
            sale.customerName,
            sale.saleNumber,
            shop.name,
            shop.currency,
            sale.totalAmount.toLocaleString(),
          ],
        });
        if (!result.ok) {
          console.error(
            "[sendOrderNotifications] buyer WhatsApp failed:",
            result.error,
          );
        }
      }
    } catch (err) {
      console.error("[sendOrderNotifications] buyer WhatsApp threw:", err);
    }
  }

  if (shop.phone) {
    try {
      const normalized = normalizePhoneForWhatsApp(shop.phone, shop.currency);
      if (!normalized) {
        console.error(
          "[sendOrderNotifications] shop phone didn't normalize:",
          shop.phone,
        );
      } else {
        const result = await sendWhatsAppTemplate({
          to: normalized,
          templateName: WHATSAPP_TEMPLATE_NEW_ORDER_SHOP_OWNER,
          languageCode: WHATSAPP_LANGUAGE_CODE,
          bodyParams: [
            sale.saleNumber,
            sale.customerName,
            shop.currency,
            sale.totalAmount.toLocaleString(),
            buyerPhone ?? "—",
          ],
        });
        if (!result.ok) {
          console.error(
            "[sendOrderNotifications] shop owner WhatsApp failed:",
            result.error,
          );
        }
      }
    } catch (err) {
      console.error("[sendOrderNotifications] shop owner WhatsApp threw:", err);
    }
  } else {
    console.error("[sendOrderNotifications] shop has no phone set:", shop.id);
  }
}
