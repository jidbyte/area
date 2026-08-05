"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus, Settings2, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";
import {
  adjustStock,
  deleteProduct,
} from "@/features/inventory/server/actions";
import { Message } from "@/shared/components/pages/message";

export function AdjustStockDialog({
  productId,
  currentQuantity,
}: {
  productId: string;
  currentQuantity: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const projected =
    direction === "add" ? currentQuantity + amount : currentQuantity - amount;

  function reset() {
    setDirection("add");
    setAmount(1);
    setReason("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function submit() {
    setError(null);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    const delta = direction === "add" ? amount : -amount;
    startTransition(async () => {
      const result = await adjustStock(productId, delta, reason.trim());
      if (!result.success) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button shape="round" className="bg-black text-white hover:bg-gray-900">
          <Settings2 /> Adjust stock
        </Button>
      </DialogTrigger>

      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            Current stock: {currentQuantity} items. This is logged to the
            product&apos;s inventory history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "add" ? "default" : "outline"}
              onClick={() => setDirection("add")}
            >
              Add stock
            </Button>
            <Button
              type="button"
              variant={direction === "remove" ? "default" : "outline"}
              onClick={() => setDirection("remove")}
            >
              Remove stock
            </Button>
          </div>

          <div className="space-y-1">
            <label className="text-neutral text-xs">Quantity</label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <p className="text-sm">
            New stock level:{" "}
            <span
              className={cn("font-semibold text-lg text-solid", projected < 0 && "text-danger")}
            >
              {projected}
            </span>
          </p>

          {error && <Message className="text-danger text-sm">{error}</Message>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving..." : "Save adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProductDialog({ productId }: { productId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      handleOpenChange(false);
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button shape="round" variant="destructive">
          <Trash2 /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete this product?</DialogTitle>
          <DialogDescription>
            It will be removed from your catalog and storefront. You can re-add
            it later, but this specific listing can&apos;t be restored.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-danger text-sm">{error}</p>}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={submit} disabled={isPending}>
            {isPending ? "Deleting..." : "Yes, delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
