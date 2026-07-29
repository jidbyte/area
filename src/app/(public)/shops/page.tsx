import { Input } from "@/shared/components/ui/input";
import { searchShops } from "@/features/shops/server/queries";
import { ShopCard } from "@/features/shops/client/shop-card";

export const dynamic = "force-dynamic";

export default async function BrowseShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const shops = await searchShops(q ?? "");

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Shops</h1>

      <form action="/shops" className="mb-6 max-w-sm">
        <Input
          type="search"
          name="q"
          placeholder="Search by shop name or ID..."
          defaultValue={q ?? ""}
        />
      </form>

      {shops.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {q ? `No shops match "${q}".` : "No shops yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shops.map((s) => (
            <ShopCard
              key={s.id}
              shop={{ slug: s.slug, name: s.name, description: s.description, logo: s.logo }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
