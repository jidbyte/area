import { UserProfile } from "@clerk/nextjs";

// Clerk's own UserProfile already covers everything this tab needs —
// profile editing, password/security, connected accounts, and account
// deletion (if enabled for this Clerk instance under User & Authentication
// -> Account deletion) — so there's no reason to rebuild any of that by
// hand here.
export default function AccountSettingsPage() {
  return (
    <div className="flex justify-center lg:justify-start">
      <UserProfile
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none border border-muted/40",
          },
        }}
      />
    </div>
  );
}
