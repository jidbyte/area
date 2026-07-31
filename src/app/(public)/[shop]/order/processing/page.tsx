import { completeSaleFromPaystackReference } from "@/features/checkout/server/actions";
import Link from "next/link";
import { redirect } from "next/navigation";


export const dynamic = "force-dynamic";

export default async function OrderProcessingPage({
  params,
  searchParams,
}: {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { shop: slug } = await params;
  const { reference, trxref } = await searchParams;
  const ref = reference ?? trxref;

  if (!ref) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground text-sm">
          Missing payment reference.
        </p>
        <Link
          href={`/${slug}/checkout`}
          className="text-primary text-sm hover:underline"
        >
          Back to checkout
        </Link>
      </div>
    );
  }

  const result = await completeSaleFromPaystackReference(ref);

  if (result.success) {
    redirect(`/${slug}/order/${result.data.saleId}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Payment not completed</h1>
      <p className="text-muted-foreground text-sm">{result.error}</p>
      <Link
        href={`/${slug}/checkout`}
        className="text-primary text-sm hover:underline"
      >
        Try again
      </Link>
    </div>
  );
}
