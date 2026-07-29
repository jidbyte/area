import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getShopForCurrentUser } from "@/features/shops/server/queries";
import { SetupForm } from "@/features/shops/client/setup-form";

export default async function SetupPage() {
  const existing = await getShopForCurrentUser();
  if (existing) redirect("/admin");

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
