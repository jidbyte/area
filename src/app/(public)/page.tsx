import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { siteConfig } from "@/shared/config/site";
import { listShops } from "@/features/shops/server/queries";
import { ShopCard } from "@/features/shops/client/shop-card";
import { Logo } from "@/shared/components/elements/logo";
import { ThemeToggle } from "@/shared/components/theme/theme-toggle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const shops = await listShops();

  return (
    <div className="min-h-screen p-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between pb-10">
        <Logo height={28} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Show when="signed-out">
            {/* Registering from the homepage is always the business path —
                sign-up lands on /setup, which creates the org. Buyers only
                ever reach auth via a shop page's "Login as buyer" button,
                which points at that shop instead. */}
            <SignInButton
              mode="modal"
              forceRedirectUrl="/admin"
              signUpForceRedirectUrl="/setup"
            >
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/setup"
              signInForceRedirectUrl="/admin"
            >
              <Button size="sm">Sign up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin">Dashboard</Link>
            </Button>
            <UserButton />
          </Show>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{siteConfig.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {siteConfig.description}
            </p>
            <Show when="signed-out">
              <p className="text-muted-foreground text-sm">
                Sign up to set up your shop, or browse shops below as a buyer.
              </p>
            </Show>
          </CardContent>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Shops</h2>
            <Link
              href="/shops"
              className="text-primary text-sm hover:underline"
            >
              Browse all shops
            </Link>
          </div>

          {shops.length === 0 ? (
            <p className="text-muted-foreground text-sm">No shops yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {shops.slice(0, 4).map((s) => (
                <ShopCard
                  key={s.id}
                  shop={{
                    slug: s.slug,
                    name: s.name,
                    description: s.description,
                    logo: s.logo,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-8">
          <h4 className="text-lg p-4 border border-neutral text-neutral">
            TEXT N
          </h4>
          <h4 className="text-lg p-4 border border-muted text-muted">TEXT M</h4>
          <span className="bg-neutral text-surface p-4">NTL</span>
          <span className="bg-muted text-ink p-4">MTD</span>
        </div>

        <p className="text-neutral text-sm">
          AREA — a multi-vendor marketplace platform with a storefront for
          buyers and an inventory/business dashboard for shops.
        </p>
      </main>
    </div>
  );
}
