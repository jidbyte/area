import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";
import { dummyProducts } from "@/lib/dummy-data";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between pb-10">
        <Logo height={28} />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{siteConfig.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">{siteConfig.description}</p>
            <Button>Setup complete — dark theme, blue palette, assets wired</Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Dummy product data (sanity check)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {dummyProducts.slice(0, 6).map((product) => (
              <Card key={product.id} className="overflow-hidden py-0">
                <div className="bg-secondary relative aspect-square">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <CardContent className="px-3 py-3">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-primary text-sm font-semibold">${product.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
