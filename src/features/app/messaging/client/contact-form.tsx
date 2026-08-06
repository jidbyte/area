"use client";

import { useState } from "react";
import { useActionTransition } from "@/shared/hooks/use-action-transition";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { FormField } from "@/shared/components/common/form-field";
import { createMessageSchema, type CreateMessageInput } from "@/features/app/messaging/server/schema";
import { createMessage } from "@/features/app/messaging/server/actions";

export function ContactForm({ shopId }: { shopId?: string }) {
  const [isPending, startTransition] = useActionTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMessageInput>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: { senderName: "", senderEmail: "", subject: "", body: "", shopId },
  });

  const onSubmit = (values: CreateMessageInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createMessage(values);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setSent(true);
      reset({ senderName: "", senderEmail: "", subject: "", body: "", shopId });
    });
  };

  if (sent) {
    return (
      <p className="rounded-md border border-muted/40 bg-muted/40 p-4 text-sm text-ink">
        Thanks — your message has been sent. We'll get back to you soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Your name" htmlFor="senderName" error={errors.senderName?.message}>
          <Input id="senderName" {...register("senderName")} />
        </FormField>
        <FormField label="Email" htmlFor="senderEmail" error={errors.senderEmail?.message}>
          <Input id="senderEmail" type="email" {...register("senderEmail")} />
        </FormField>
      </div>

      <FormField label="Subject" htmlFor="subject" error={errors.subject?.message}>
        <Input id="subject" {...register("subject")} />
      </FormField>

      <FormField label="Message" htmlFor="body" error={errors.body?.message}>
        <Textarea id="body" rows={5} {...register("body")} />
      </FormField>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" disabled={isPending} loading={isPending} shape="round">
        {isPending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
