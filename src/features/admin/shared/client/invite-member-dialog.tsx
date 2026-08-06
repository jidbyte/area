"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { FormField } from "@/shared/components/common/form-field";
import { createInvitation } from "@/features/app/stores/server/invitations";

type InviteFormValues = {
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
};

export function InviteMemberDialog({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    defaultValues: { email: "", role: "Editor" },
  });

  const onSubmit = (values: InviteFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createInvitation(shopId, values.email, values.role);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button shape="round">
          <Plus className="size-4" /> Invite member
        </Button>
      </DialogTrigger>

      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Email"
            htmlFor="email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Required" })}
            />
          </FormField>

          <FormField label="Role" htmlFor="role">
            <select
              id="role"
              className="h-9 w-full rounded-md border border-muted/40 bg-surface px-3 text-sm text-ink"
              {...register("role")}
            >
              <option value="Admin">Admin — everything except billing</option>
              <option value="Editor">Editor — create/edit/delete content</option>
              <option value="Viewer">Viewer — read-only</option>
            </select>
          </FormField>

          {serverError && <p className="text-sm text-danger">{serverError}</p>}

          <Button type="submit" disabled={isPending} loading={isPending} className="w-full">
            {isPending ? "Sending..." : "Send invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
