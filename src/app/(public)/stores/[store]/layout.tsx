import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop || !shop.isActive) notFound();

  return <>{children}</>;
}
