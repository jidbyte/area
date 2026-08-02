import { ThemeToggle } from "@/shared/components/theme/theme-toggle";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { ShoppingCart, Trash2, ArrowRight, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/components/ui/dialog";


export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1>TEST SAMPLES</h1>
        <ThemeToggle />
      </div>

      {/*Color scheme */}
      {/* <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded bg-surface p-4 text-ink">Surface</div>
        <div className="rounded bg-ink p-4 text-surface">Ink</div>
        <div className="rounded bg-neutral p-4 text-white">Neutral</div>
        <div className="rounded bg-muted p-4 text-ink">Muted</div>

        <div className="rounded bg-primary p-4 text-surface">Primary</div>
        <div className="rounded bg-secondary p-4 text-ink">Secondary</div>
        <div className="rounded bg-accent p-4 text-ink">Accent</div>
        <div className="rounded bg-solid p-4 text-surface">Solid</div>

        <div className="rounded bg-success p-4 text-white">Success</div>
        <div className="rounded bg-warning p-4 text-white">Warning</div>
        <div className="rounded bg-danger p-4 text-white">Danger</div>
        <div className="rounded bg-info p-4 text-bg">Info</div>

        <div className="rounded bg-border p-4 text-ink">Border</div>
        <div className="rounded bg-input p-4 text-ink">Input</div>
        <div className="rounded bg-ring p-4 text-surface">Ring</div>
        <div className="rounded bg-overlay p-4 text-surface">Overlay</div>
      </div> */}

      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>

        <DialogContent size="xl">...</DialogContent>
      </Dialog>

      {/*Button examples */}
      <div className="flex flex-col gap-8 p-8">
        {/* Variants */}
        <section className="flex flex-wrap items-center gap-3">
          <Button>Add to cart</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive" shape="round">
            Delete account
          </Button>
          <Button variant="link">View details</Button>
        </section>

        {/* Sizes */}
        <section className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add item">
            <Plus />
          </Button>
        </section>

        {/* With icons */}
        <section className="flex flex-wrap items-center gap-3">
          <Button>
            <ShoppingCart />
            Add to cart
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 />
            Remove
          </Button>
          <Button variant="outline">
            Continue
            <ArrowRight />
          </Button>
        </section>

        {/* Loading state */}
        <section className="flex flex-wrap items-center gap-3">
          <Button disabled>
            <Loader2 className="animate-spin" />
            Processing...
          </Button>
        </section>

        {/* Disabled state */}
        <section className="flex flex-wrap items-center gap-3">
          <Button disabled>Default disabled</Button>
          <Button variant="outline" disabled>
            Outline disabled
          </Button>
        </section>

        {/* asChild — renders as a Link instead of a <button>, keeping all styling */}
        <section className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/shop">Browse shop</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </section>

        {/* Icon-only buttons, common in headers/toolbars */}
        <section className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Cart">
            <ShoppingCart />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete">
            <Trash2 />
          </Button>
        </section>

        {/* Full width, e.g. inside a form or card */}
        <section className="max-w-sm">
          <Button className="w-full">Checkout</Button>
        </section>
      </div>
    </div>
  );
}


