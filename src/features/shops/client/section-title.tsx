import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SectionTitle({
  title,
  description,
  href,
}: {
  title: string;
  description?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-solid text-xl font-bold tracking-widest uppercase">
          {title}
        </h2>
        {description && (
          <p className="text-neutral mt-1 text-sm">{description}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="text-primary flex items-center gap-1 shrink-0 text-sm font-medium hover:underline"
        >
          <span>View all</span>
          <ArrowRight className="inline size-4" />
        </Link>
      )}
    </div>
  );
}
