import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShopOnboardingForm } from "@/features/shops/client/shop-onboarding-form";

export default async function NewShopPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/shops/new");

  return (
    <div className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Create your shop</CardTitle>
        </CardHeader>
        <CardContent>
          <ShopOnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
