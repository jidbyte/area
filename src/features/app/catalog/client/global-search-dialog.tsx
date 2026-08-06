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

export function GlobalSearchDialog() {
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
          action="/shop"
          className="flex items-center gap-2"
          onSubmit={() => setOpen(false)}
        >
          <Input
            type="search"
            name="q"
            placeholder="Search across every store..."
            autoFocus
          />
          <Button variant="secondary" type="submit" size="icon" aria-label="Search">
            <Search />
          </Button>
        </form>

        <p className="my-2 text-sm text-neutral">
          Searches products from every store on the platform.
        </p>
      </DialogContent>
    </Dialog>
  );
}
