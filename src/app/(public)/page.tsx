import Link from "next/link";
import { ArrowRight, PackageSearch, ShieldCheck, Truck, Users } from "lucide-react";

import { GlobalNav } from "@/shared/components/app/global-nav";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { siteConfig } from "@/shared/config/site";
import { listShops } from "@/features/app/stores/server/queries";
import { ShopCard } from "@/features/app/stores/client/shop-card";
import { ProductGridSection } from "@/features/app/catalog/client/product-grid-section";
import {
  countActiveProducts,
  getPlatformRankedBySales,
} from "@/features/app/catalog/server/queries";
import ShopFooter from "@/features/app/stores/client/footer";

export const dynamic = "force-dynamic";

const SECTION_SIZE_MANY = 15;
const SECTION_SIZE_FEW = 8;
const MANY_PRODUCTS_THRESHOLD = 30;

const FEATURES = [
  {
    icon: Truck,
    title: "Fast delivery",
    description: "Every store ships direct — track your order right from checkout.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    description: "Every transaction runs through Paystack, so your card details stay protected.",
  },
  {
    icon: Users,
    title: "Real sellers",
    description: "Independent businesses run every storefront on the platform — no dropshipping middlemen.",
  },
  {
    icon: PackageSearch,
    title: "Easy returns",
    description: "Reach out to any store directly through their page if something isn't right.",
  },
];

export default async function Home() {
  const shops = await listShops();
  const totalActive = await countActiveProducts();
  const manyProducts = totalActive >= MANY_PRODUCTS_THRESHOLD;
  const sectionSize = manyProducts ? SECTION_SIZE_MANY : SECTION_SIZE_FEW;

  const bestSelling = await getPlatformRankedBySales(sectionSize, 0);
  const featured = await getPlatformRankedBySales(sectionSize, sectionSize);

  return (
    <div className="min-h-screen">
      <GlobalNav />

      <main className="mx-auto max-w-6xl p-4 md:px-12">
        {/* Hero */}
        <div className="relative flex flex-col overflow-hidden rounded-xl bg-sky-200 my-6 xl:min-h-80">
          <div className="relative z-10 p-6 md:p-12 max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full bg-sky-500 p-1.5 pr-4 text-xs text-white sm:text-sm">
              <span className="ml-1 rounded-full bg-sky-800 px-3 py-1 text-xs text-white">
                NEW
              </span>
              A marketplace built for independent stores
            </div>

            <h1 className="my-6 max-w-xl bg-linear-to-r from-sky-800 to-sky-400 bg-clip-text text-3xl font-bold leading-8 text-transparent sm:text-5xl sm:leading-10">
              Shop from stores you'll love. Sell to buyers who trust you.
            </h1>

            <p className="mt-4 w-full text-sm font-medium text-sky-800 md:w-2/3">
              {siteConfig.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop">
                  Start shopping <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/onboarding">Start selling</Link>
              </Button>
            </div>
          </div>
        </div>

        <ProductGridSection title="Best selling" products={bestSelling} manyProducts={manyProducts} />
        <ProductGridSection title="Featured" products={featured} manyProducts={manyProducts} />

        {/* Feature cards */}
        <section className="py-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-muted/40 p-5">
                <f.icon className="mb-3 size-6 text-primary" />
                <p className="font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-sm text-neutral">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Value proposition */}
        <section className="rounded-xl bg-accent/40 p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-ink md:text-3xl">
                One platform, hundreds of independent stores
              </h2>
              <p className="mt-3 text-neutral">
                Every store on {siteConfig.name} runs its own inventory, pricing, and
                fulfillment — you're buying directly from the business behind it, not a
                warehouse. Setting up your own store takes minutes.
              </p>
              <Button asChild className="mt-6">
                <Link href="/onboarding">Set up your store</Link>
              </Button>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral">
                Featured stores
              </h3>
              {shops.length === 0 ? (
                <p className="text-sm text-neutral">No stores yet — be the first.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {shops.slice(0, 4).map((s) => (
                    <ShopCard
                      key={s.id}
                      shop={{ slug: s.slug, name: s.name, description: s.description, logo: s.logo }}
                    />
                  ))}
                </div>
              )}
              <Link href="/stores" className="mt-3 inline-block text-sm text-primary hover:underline">
                Browse all stores →
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 text-center">
          <h2 className="text-xl font-bold text-ink md:text-2xl">Stay in the loop</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral">
            New stores, new arrivals, and platform updates — straight to your inbox.
          </p>
          <form className="mx-auto mt-5 flex max-w-sm gap-2">
            <Input type="email" placeholder="you@example.com" required />
            <Button type="submit">Subscribe</Button>
          </form>
        </section>
      </main>

      <ShopFooter />
    </div>
  );
}
