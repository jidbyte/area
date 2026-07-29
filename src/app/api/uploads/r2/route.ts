import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { createPresignedUploadUrl, publicUrlForKey } from "@/shared/lib/r2";
import { getShopBySlug } from "@/features/shops/server/queries";
import { isMemberOfShopOrg } from "@/features/shops/server/membership";

const bodySchema = z.object({
  shopSlug: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().regex(/^image\//, "Only image uploads are allowed"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { shopSlug, fileName, contentType } = parsed.data;

  const shop = await getShopBySlug(shopSlug);
  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }

  const isMember = await isMemberOfShopOrg(userId, shop.clerkOrgId);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const fileKey = `shops/${shop.id}/products/${crypto.randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await createPresignedUploadUrl(fileKey, contentType);
    const publicUrl = publicUrlForKey(fileKey);
    return NextResponse.json({ uploadUrl, fileKey, publicUrl });
  } catch (err) {
    console.error("[api/uploads/r2] presign failed:", err);
    return NextResponse.json(
      { error: "Image storage isn't configured yet. Check your R2 env vars." },
      { status: 500 },
    );
  }
}
