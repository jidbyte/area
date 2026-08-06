import { notFound } from "next/navigation";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { listCouponsByShop } from "@/features/admin/coupons/server/actions";
import { CouponsTable } from "@/features/admin/coupons/client/coupons-table";
import { CouponFormDialog } from "@/features/admin/coupons/client/coupon-form-dialog";

export default async function CouponsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  const coupons = await listCouponsByShop(shop.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Coupons</h1>
          <p className="text-sm text-neutral">
            Discount codes buyers can apply at checkout.
          </p>
        </div>
        <CouponFormDialog shopId={shop.id} />
      </div>

      <CouponsTable shopId={shop.id} currency={shop.currency} coupons={coupons} />
    </div>
  );
}
