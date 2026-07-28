import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { isPlatformAdmin } from "@/features/auth/server/platform-admin";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/admin");
  if (!(await isPlatformAdmin())) redirect("/");

  return <div className="mx-auto min-h-screen max-w-3xl p-8">{children}</div>;
}
