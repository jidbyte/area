import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShoppingCart,
  Truck,
  TrendingUp,
  Receipt,
  FileText,
  Ticket,
} from "lucide-react";

import { getShopBySlug } from "@/features/app/stores/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const SECTIONS = [
  {
    href: "sales",
    label: "Sale orders",
    description: "Every sale recorded through checkout or in person.",
    icon: ShoppingCart,
  },
  {
    href: "purchases",
    label: "Purchase orders",
    description: "Stock ordered in from your suppliers.",
    icon: Truck,
  },
  {
    href: "income",
    label: "Income",
    description: "Revenue that doesn't come from a direct sale.",
    icon: TrendingUp,
  },
  {
    href: "expenses",
    label: "Expenses",
    description: "Taxes, bills, salaries — spend outside of purchases.",
    icon: Receipt,
  },
  {
    href: "invoices",
    label: "Invoices",
    description: "Generate, send, and track customer invoices.",
    icon: FileText,
  },
  {
    href: "coupons",
    label: "Coupons",
    description: "Discount codes buyers can apply at checkout.",
    icon: Ticket,
  },
];

export default async function TransactionsHubPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const shop = await getShopBySlug(storeSlug);
  if (!shop) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Transactions</h1>
        <p className="text-sm text-neutral">
          Everything that moves money in or out of your store.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={`/${storeSlug}/transactions/${s.href}`}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <s.icon className="size-5 text-primary" />
                <CardTitle className="text-base">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral">{s.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
