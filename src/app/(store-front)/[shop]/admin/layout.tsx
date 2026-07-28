import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getShopBySlug } from "@/features/shops/server/queries";
import { isMemberOfShopOrg } from "@/features/shops/server/membership";

export default async function ShopAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const { shop: slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/${slug}/admin`);

  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  // Check membership directly rather than relying on the session's "active
  // org" — a staff member of multiple shops should be able to open any of
  // their shops' admin URLs without first switching an org selector.
  const isMember = await isMemberOfShopOrg(userId, shop.clerkOrgId);
  if (!isMember) redirect("/");

  return (
    <div className="mx-auto min-h-screen max-w-4xl p-8">
      <nav className="mb-6 flex gap-4 border-b pb-3 text-sm">
        <Link
          href={`/${slug}/admin`}
          className="text-muted-foreground hover:text-foreground"
        >
          Overview
        </Link>
        <Link
          href={`/${slug}/admin/products`}
          className="text-muted-foreground hover:text-foreground"
        >
          Products
        </Link>
      </nav>
      {children}
    </div>
  );
}
