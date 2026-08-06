import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ensureAppUser } from "@/shared/authz/current-user";
import { getShopForCurrentUser } from "@/features/app/stores/server/queries";
import { AccountTypeChooser } from "@/features/app/auth/client/account-type-chooser";

// Shown once, right after sign-up (see the SignUp component's
// fallbackRedirectUrl). Already-onboarded users who land here get bounced
// to wherever they actually belong instead of seeing the chooser again.
export default async function OnboardingPage() {
  const user = await ensureAppUser();
  if (!user) redirect("/sign-in");

  if (user.onboardingCompletedAt) {
    const ownedShop = await getShopForCurrentUser();
    redirect(ownedShop ? `/${ownedShop.slug}/dashboard` : `/shop/${user.clerkUserId}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-8 pt-20">
      <Card className="border-none shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">How will you use Area?</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountTypeChooser />
        </CardContent>
      </Card>
    </div>
  );
}
