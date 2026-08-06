"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

export function ShopHeaderSearch({
  slug,
  initialQuery = "",
}: {
  slug: string;
  initialQuery?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search />
        </Button>
      </DialogTrigger>

      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Search products</DialogTitle>
        </DialogHeader>

        <form
          action={`/stores/${slug}`}
          className="flex items-center gap-2"
          onSubmit={() => setOpen(false)}
        >
          <Input
            type="search"
            name="q"
            placeholder="Enter product name..."
            defaultValue={initialQuery}
            autoFocus
          />
          <Button
            variant="secondary"
            type="submit"
            size="icon"
            aria-label="Search"
          >
            <Search />
          </Button>
        </form>

        <div>
          <p className="my-4 text-neutral">
            No results found? Try searching with different keywords or check the
            spelling.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
