import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/shops/server/queries";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const { shop: slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop || shop.status === "suspended") notFound();

  return <>{children}</>;
}
