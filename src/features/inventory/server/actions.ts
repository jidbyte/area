"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/shared/db";
import {
  product,
  category,
  image,
  productCategory,
  inventoryLog,
} from "@/shared/db/schema";
import { requireShopMembership } from "@/features/shops/server/authorize";
import { createProductSchema, type CreateProductInput } from "./schema";

export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };

async function getOrCreateCategoryIds(
  shopId: string,
  names: string[],
): Promise<string[]> {
  const cleaned = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean)),
  );
  if (cleaned.length === 0) return [];

  const existing = await db.query.category.findMany({
    where: and(eq(category.shopId, shopId), inArray(category.name, cleaned)),
  });
  const existingNames = new Set(existing.map((c) => c.name));
  const toCreate = cleaned.filter((n) => !existingNames.has(n));

  const created = toCreate.length
    ? await db
        .insert(category)
        .values(toCreate.map((name) => ({ shopId, name })))
        .returning()
    : [];

  return [...existing, ...created].map((c) => c.id);
}

export async function createProduct(
  shopId: string,
  input: CreateProductInput,
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireShopMembership(shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const {
    name,
    sku,
    brand,
    model,
    description,
    price,
    cost,
    quantity,
    restockLevel,
    optimalLevel,
    categories,
    images,
  } = parsed.data;

  const existingSku = await db.query.product.findFirst({
    where: eq(product.sku, sku),
  });
  if (existingSku) {
    return { success: false, error: "That SKU is already in use." };
  }

  const categoryIds = await getOrCreateCategoryIds(shopId, categories);

  const [created] = await db
    .insert(product)
    .values({
      shopId,
      name,
      sku,
      brand: brand || null,
      model: model || null,
      description: description || null,
      price,
      cost,
      quantity,
      restockLevel,
      optimalLevel,
      isActive: true,
    })
    .returning();

  if (images.length > 0) {
    await db.insert(image).values(
      images.map((img) => ({
        productId: created.id,
        url: img.url,
        fileKey: img.fileKey,
        isPrimary: img.isPrimary,
      })),
    );
  }

  if (categoryIds.length > 0) {
    await db
      .insert(productCategory)
      .values(
        categoryIds.map((categoryId) => ({
          productId: created.id,
          categoryId,
        })),
      );
  }

  if (quantity > 0) {
    await db.insert(inventoryLog).values({
      productId: created.id,
      delta: quantity,
      reason: "Initial stock",
      actorClerkUserId: authResult.userId,
    });
  }

  revalidatePath(`/${authResult.shop.slug}/admin/products`);
  return { success: true, data: { id: created.id } };
}

export async function updateProduct(
  productId: string,
  input: CreateProductInput,
): Promise<ActionResult> {
  const existingProduct = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });
  if (!existingProduct) return { success: false, error: "Product not found." };

  const authResult = await requireShopMembership(existingProduct.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const {
    name,
    sku,
    brand,
    model,
    description,
    price,
    cost,
    quantity,
    restockLevel,
    optimalLevel,
    categories,
    images,
  } = parsed.data;

  const skuOwner = await db.query.product.findFirst({
    where: eq(product.sku, sku),
  });
  if (skuOwner && skuOwner.id !== productId) {
    return { success: false, error: "That SKU is already in use." };
  }

  const quantityDelta = quantity - existingProduct.quantity;
  const categoryIds = await getOrCreateCategoryIds(
    existingProduct.shopId,
    categories,
  );

  await db
    .update(product)
    .set({
      name,
      sku,
      brand: brand || null,
      model: model || null,
      description: description || null,
      price,
      cost,
      quantity,
      restockLevel,
      optimalLevel,
    })
    .where(eq(product.id, productId));

  // Replace images/categories wholesale — simplest correct approach for now.
  await db.delete(image).where(eq(image.productId, productId));
  if (images.length > 0) {
    await db.insert(image).values(
      images.map((img) => ({
        productId,
        url: img.url,
        fileKey: img.fileKey,
        isPrimary: img.isPrimary,
      })),
    );
  }

  await db
    .delete(productCategory)
    .where(eq(productCategory.productId, productId));
  if (categoryIds.length > 0) {
    await db
      .insert(productCategory)
      .values(categoryIds.map((categoryId) => ({ productId, categoryId })));
  }

  if (quantityDelta !== 0) {
    await db.insert(inventoryLog).values({
      productId,
      delta: quantityDelta,
      reason: "Manual edit",
      actorClerkUserId: authResult.userId,
    });
  }

  revalidatePath(`/${authResult.shop.slug}/admin/products`);
  return { success: true, data: undefined };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const existingProduct = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });
  if (!existingProduct) return { success: false, error: "Product not found." };

  const authResult = await requireShopMembership(existingProduct.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  await db
    .update(product)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(product.id, productId));

  revalidatePath(`/${authResult.shop.slug}/admin/products`);
  return { success: true, data: undefined };
}

export async function adjustStock(
  productId: string,
  delta: number,
  reason: string,
): Promise<ActionResult> {
  const existingProduct = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });
  if (!existingProduct) return { success: false, error: "Product not found." };

  const authResult = await requireShopMembership(existingProduct.shopId);
  if (!authResult.ok) return { success: false, error: authResult.error };

  const nextQuantity = existingProduct.quantity + delta;
  if (nextQuantity < 0)
    return { success: false, error: "Stock can't go below zero." };

  await db
    .update(product)
    .set({ quantity: nextQuantity })
    .where(eq(product.id, productId));
  await db.insert(inventoryLog).values({
    productId,
    delta,
    reason: reason || "Manual adjustment",
    actorClerkUserId: authResult.userId,
  });

  revalidatePath(`/${authResult.shop.slug}/admin/products`);
  return { success: true, data: undefined };
}
