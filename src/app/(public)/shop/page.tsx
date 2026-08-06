import { Input } from "@/shared/components/ui/input";
import { GlobalNav } from "@/shared/components/app/global-nav";
import { ProductGridSection } from "@/features/app/catalog/client/product-grid-section";
import {
  countActiveProducts,
  getPlatformRankedBySales,
  getPlatformLatestProducts,
  searchPlatformProducts,
  listAllCategoryNames,
} from "@/features/app/catalog/server/queries";

export const dynamic = "force-dynamic";

const MANY_PRODUCTS_THRESHOLD = 30;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort } = await searchParams;
  const isFiltering = !!(q || category || sort);

  const totalActive = await countActiveProducts();
  const manyProducts = totalActive >= MANY_PRODUCTS_THRESHOLD;
  const sectionSize = manyProducts ? 15 : 8;

  const categories = await listAllCategoryNames();

  if (isFiltering) {
    const results = await searchPlatformProducts({
      query: q,
      categoryName: category,
      sort: sort === "price-asc" || sort === "price-desc" ? sort : "newest",
      limit: 60,
    });

    return (
      <div>
        <GlobalNav />
        <div className="mx-auto max-w-6xl p-4 md:px-12">
          <SearchBar q={q} category={category} sort={sort} categories={categories} />

          <div className="py-4">
            <p className="mb-4 text-sm text-neutral">
              {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            <ProductGridSection title="" products={results} manyProducts={manyProducts} />
            {results.length === 0 && (
              <p className="py-16 text-center text-neutral">
                No products match your search. Try different keywords or filters.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const bestSelling = await getPlatformRankedBySales(sectionSize, 0);
  const featured = await getPlatformRankedBySales(sectionSize, sectionSize);
  const excludeIds = [...bestSelling, ...featured].map((p) => p.id);
  const latest = await getPlatformLatestProducts(sectionSize, excludeIds);

  return (
    <div>
      <GlobalNav />
      <div className="mx-auto max-w-6xl p-4 md:px-12">
        <SearchBar q={q} category={category} sort={sort} categories={categories} />

        <ProductGridSection title="Best selling" products={bestSelling} manyProducts={manyProducts} />
        <ProductGridSection title="Featured" products={featured} manyProducts={manyProducts} />
        <ProductGridSection title="Latest arrivals" products={latest} manyProducts={manyProducts} />

        {bestSelling.length === 0 && featured.length === 0 && latest.length === 0 && (
          <div className="py-16 text-center text-neutral">
            <p className="text-lg font-medium text-ink">No products yet</p>
            <p className="mt-1 text-sm">Check back soon — stores are just getting started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Plain native <select>/<input> inside a GET form — this bar has to work
// without client JS, since it's driven entirely by the page's searchParams.
function SearchBar({
  q,
  category,
  sort,
  categories,
}: {
  q?: string;
  category?: string;
  sort?: string;
  categories: string[];
}) {
  const fieldClass =
    "h-9 rounded-md border border-muted/40 bg-surface px-3 text-sm text-ink";

  return (
    <form
      action="/shop"
      className="flex flex-col gap-3 border-b border-muted/40 py-4 sm:flex-row sm:items-center"
    >
      <Input
        type="search"
        name="q"
        placeholder="Search products across all stores..."
        defaultValue={q}
        className="sm:max-w-sm"
      />

      <select name="category" defaultValue={category || ""} className={fieldClass}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select name="sort" defaultValue={sort || "newest"} className={fieldClass}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>

      <button
        type="submit"
        className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-surface"
      >
        Search
      </button>
    </form>
  );
}
