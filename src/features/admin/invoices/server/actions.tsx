"use server";

import { and, count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import { invoice, invoiceItem } from "@/shared/db/schema";
import { requireShopMembership } from "@/features/app/stores/server/authorize";
import { getSaleById } from "@/features/admin/sales/server/queries";
import { uploadBufferToR2 } from "@/shared/lib/r2";
import { getResendClient, fromAddressForShop } from "@/features/app/notifications/server/resend";
import { sendWhatsAppTemplate } from "@/shared/lib/whatsapp";
import { normalizePhoneForWhatsApp } from "@/shared/utils/phone";
import {
  WHATSAPP_TEMPLATE_INVOICE_READY,
  WHATSAPP_LANGUAGE_CODE,
} from "@/shared/config/whatsapp";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument, type InvoicePdfData } from "./pdf";
import { createInvoiceFromSaleSchema, type CreateInvoiceFromSaleInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

async function generateInvoiceNumber(shopId: string): Promise<string> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(invoice)
    .where(eq(invoice.shopId, shopId));
  return `INV-${String(value + 1).padStart(4, "0")}`;
}

export async function listInvoicesByShop(shopId: string) {
  return db.query.invoice.findMany({
    where: eq(invoice.shopId, shopId),
    orderBy: [desc(invoice.createdAt)],
  });
}

export async function createInvoiceFromSale(
  shopId: string,
  input: CreateInvoiceFromSaleInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = createInvoiceFromSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const sale = await getSaleById(parsed.data.saleId);
  if (!sale || sale.shopId !== shopId) {
    return { success: false, error: "Sale not found." };
  }

  const existing = await db.query.invoice.findFirst({
    where: and(eq(invoice.shopId, shopId), eq(invoice.saleId, sale.id)),
  });
  if (existing) return { success: false, error: "This sale already has an invoice." };

  const invoiceNumber = await generateInvoiceNumber(shopId);
  const subtotal = sale.items.reduce((sum, i) => sum + i.subtotal, 0);

  const [created] = await db
    .insert(invoice)
    .values({
      shopId,
      invoiceNumber,
      saleId: sale.id,
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerEmail: sale.customer?.email ?? null,
      customerPhone: sale.customer?.phone ?? null,
      issueDate: new Date(),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      subtotal,
      discountAmount: sale.discountAmount,
      totalAmount: sale.totalAmount,
      status: "draft",
      notes: parsed.data.notes || null,
    })
    .returning();

  await db.insert(invoiceItem).values(
    sale.items.map((item) => ({
      invoiceId: created.id,
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
  );

  revalidatePath(`/${authResult.shop.slug}/transactions/invoices`);
  return { success: true, data: { id: created.id } };
}

export async function generateInvoicePdf(invoiceId: string): Promise<ActionResult<{ pdfUrl: string }>> {
  const record = await db.query.invoice.findFirst({
    where: eq(invoice.id, invoiceId),
    with: { items: true },
  });
  if (!record) return { success: false, error: "Invoice not found." };

  const authResult = await requireShopMembership(record.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const shop = authResult.shop;
  const data: InvoicePdfData = {
    shopName: shop.name,
    shopEmail: shop.email,
    shopPhone: shop.phone,
    shopAddress: shop.address,
    invoiceNumber: record.invoiceNumber,
    issueDate: record.issueDate,
    dueDate: record.dueDate,
    customerName: record.customerName,
    customerEmail: record.customerEmail,
    customerPhone: record.customerPhone,
    items: record.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
    })),
    subtotal: record.subtotal,
    discountAmount: record.discountAmount,
    totalAmount: record.totalAmount,
    currency: shop.currency,
    notes: record.notes,
  };

  let pdfUrl: string;
  try {
    const buffer = await renderToBuffer(<InvoiceDocument data={data} />);
    const key = `invoices/${shop.id}/${record.invoiceNumber}.pdf`;
    pdfUrl = await uploadBufferToR2(key, buffer, "application/pdf");
  } catch (err) {
    console.error("[generateInvoicePdf] failed:", err);
    return { success: false, error: "Couldn't generate the PDF. Please try again." };
  }

  await db
    .update(invoice)
    .set({ pdfUrl, pdfFileKey: `invoices/${shop.id}/${record.invoiceNumber}.pdf` })
    .where(eq(invoice.id, invoiceId));

  revalidatePath(`/${shop.slug}/transactions/invoices`);
  return { success: true, data: { pdfUrl } };
}

async function ensurePdf(invoiceId: string): Promise<ActionResult<{ pdfUrl: string }>> {
  const record = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
  if (!record) return { success: false, error: "Invoice not found." };
  if (record.pdfUrl) return { success: true, data: { pdfUrl: record.pdfUrl } };
  return generateInvoicePdf(invoiceId);
}

export async function sendInvoiceByEmail(invoiceId: string): Promise<ActionResult> {
  const record = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
  if (!record) return { success: false, error: "Invoice not found." };

  const authResult = await requireShopMembership(record.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (!record.customerEmail) {
    return { success: false, error: "This invoice's customer has no email on file." };
  }

  const pdfResult = await ensurePdf(invoiceId);
  if (!pdfResult.success) return pdfResult;

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: fromAddressForShop(authResult.shop.name),
      to: record.customerEmail,
      subject: `Invoice ${record.invoiceNumber} from ${authResult.shop.name}`,
      text: `Hi ${record.customerName},\n\nYour invoice ${record.invoiceNumber} is ready. You can view/download it here:\n${pdfResult.data.pdfUrl}\n\nThanks,\n${authResult.shop.name}`,
    });
  } catch (err) {
    console.error("[sendInvoiceByEmail] failed:", err);
    return { success: false, error: "Couldn't send the email. Please try again." };
  }

  await db
    .update(invoice)
    .set({ sentViaEmail: new Date(), status: record.status === "draft" ? "sent" : record.status })
    .where(eq(invoice.id, invoiceId));

  revalidatePath(`/${authResult.shop.slug}/transactions/invoices`);
  return { success: true, data: undefined };
}

export async function sendInvoiceByWhatsapp(invoiceId: string): Promise<ActionResult> {
  const record = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
  if (!record) return { success: false, error: "Invoice not found." };

  const authResult = await requireShopMembership(record.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  if (!record.customerPhone) {
    return { success: false, error: "This invoice's customer has no phone number on file." };
  }
  const normalizedPhone = normalizePhoneForWhatsApp(record.customerPhone, authResult.shop.currency);
  if (!normalizedPhone) {
    return { success: false, error: "This customer's phone number isn't valid for WhatsApp." };
  }

  const pdfResult = await ensurePdf(invoiceId);
  if (!pdfResult.success) return pdfResult;

  const result = await sendWhatsAppTemplate({
    to: normalizedPhone,
    templateName: WHATSAPP_TEMPLATE_INVOICE_READY,
    languageCode: WHATSAPP_LANGUAGE_CODE,
    bodyParams: [
      record.customerName,
      record.invoiceNumber,
      authResult.shop.name,
      authResult.shop.currency,
      String(record.totalAmount),
      pdfResult.data.pdfUrl,
    ],
  });

  if (!result.ok) return { success: false, error: result.error };

  await db
    .update(invoice)
    .set({ sentViaWhatsapp: new Date(), status: record.status === "draft" ? "sent" : record.status })
    .where(eq(invoice.id, invoiceId));

  revalidatePath(`/${authResult.shop.slug}/transactions/invoices`);
  return { success: true, data: undefined };
}

export async function markInvoicePaid(invoiceId: string): Promise<ActionResult> {
  const record = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
  if (!record) return { success: false, error: "Invoice not found." };

  const authResult = await requireShopMembership(record.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db.update(invoice).set({ status: "paid" }).where(eq(invoice.id, invoiceId));

  revalidatePath(`/${authResult.shop.slug}/transactions/invoices`);
  return { success: true, data: undefined };
}

export async function voidInvoice(invoiceId: string): Promise<ActionResult> {
  const record = await db.query.invoice.findFirst({ where: eq(invoice.id, invoiceId) });
  if (!record) return { success: false, error: "Invoice not found." };

  const authResult = await requireShopMembership(record.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db.update(invoice).set({ status: "void" }).where(eq(invoice.id, invoiceId));

  revalidatePath(`/${authResult.shop.slug}/transactions/invoices`);
  return { success: true, data: undefined };
}
