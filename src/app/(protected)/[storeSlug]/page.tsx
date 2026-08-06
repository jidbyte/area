import { redirect } from "next/navigation";

// Per spec: visiting /[store-slug] directly (with no sub-route) always
// redirects to the dashboard. Auth/membership is already enforced by the
// parent layout before this ever renders.
export default async function StoreRootPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  redirect(`/${storeSlug}/dashboard`);
}
