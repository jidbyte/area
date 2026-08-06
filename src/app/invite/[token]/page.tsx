import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { acceptInvitation } from "@/features/app/stores/server/invitations";

// Deliberately outside the (protected) route group — that layout redirects
// unauthenticated visitors to /sign-in without preserving the current URL,
// which would lose the invitation token. This page handles its own
// sign-in/sign-up redirect so the token survives the round trip (Clerk's
// SignIn/SignUp both honor ?redirect_url=).
export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  if (!userId) {
    const returnTo = encodeURIComponent(`/invite/${token}`);
    return (
      <div className="mx-auto max-w-md p-8 pt-20">
        <Card>
          <CardHeader>
            <CardTitle>You've been invited</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/sign-in?redirect_url=${returnTo}`}>Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/sign-up?redirect_url=${returnTo}`}>Create account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const result = await acceptInvitation(token);

  return (
    <div className="mx-auto max-w-md p-8 pt-20">
      <Card>
        <CardHeader>
          <CardTitle>{result.success ? "You're in" : "Couldn't accept invitation"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral">
            {result.success
              ? "You've joined the store. Head over to the dashboard to get started."
              : result.error}
          </p>
          {result.success && (
            <Button asChild>
              <Link href={`/${result.data.accountSlug}/dashboard`}>Go to dashboard</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
