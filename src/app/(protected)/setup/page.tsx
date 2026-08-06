import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/app/stores/server/queries";
import { SetupForm } from "@/features/app/stores/client/setup-form";

export default async function SetupPage() {
  const existing = await getShopForCurrentUser();
  if (existing) redirect(`/${existing.slug}/dashboard`);

  return (
    <div className="mx-auto max-w-md p-8 pt-20">
      <Card>
        <CardHeader>
          <CardTitle>Set up your shop</CardTitle>
        </CardHeader>
        <CardContent>
          <SetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
