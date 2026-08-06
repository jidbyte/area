
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRightIcon } from "lucide-react";

import { demoImages } from "@/assets/img";
import { Button } from "@/shared/components/ui/button";

export type HeroPageProps = {
  shopSlug: string;
  shopName: string;
  description: string | null;
  currency: string;
  /** null when the shop has no products yet — hides the "starts from" stat. */
  startingPrice: number | null;
  productCount: number;
  categories: string[];
};

export default function HeroPage({
  shopSlug,
  shopName,
  description,
  currency,
  startingPrice,
  productCount,
  categories,
}: HeroPageProps) {
  return (
    <div>
      <div className="mx-auto flex flex-col gap-6 xl:flex-row">
        <div className="bg-sky-200 relative flex flex-1 flex-col overflow-hidden rounded-xl my-3 md:my-6 xl:min-h-80">
          <div className="relative z-10 p-6 md:p-12">
            <div>
              <div className="inline-flex items-center gap-3 bg-sky-500 text-white pr-4 p-1.5 rounded-full text-xs sm:text-sm">
                <span className="bg-sky-800 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs">
                  NEWS
                </span>
                Free Shipping on Orders Above $50!
                <ChevronRightIcon
                  className="group-hover:ml-2 transition-all"
                  size={16}
                />
              </div>

              <h2 className="text-3xl sm:text-5xl leading-8 md:leading-10 my-6 font-bold bg-linear-to-r from-sky-800 to-sky-400 bg-clip-text text-transparent max-w-xs sm:max-w-md">
                Gadgets you'll love. <br /> Prices you'll trust.
              </h2>

              <div className="text-sky-800 md:w-1/2 w-full text-sm font-medium mt-4">
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Aperiam nobis nam illo esse unde laborum mollitia vitae
                consequatur nemo suscipit beatae illum.
              </div>

              <Button
                size="lg"
                shape="round"
                className="bg-black hover:bg-gray-700 text-white mt-6"
              >
                Learn more <ArrowRight />
              </Button>
            </div>
          </div>

          <Image
            src={demoImages.hero_model_img}
            alt=""
            className="pointer-events-none max-w-xs opacity-90 sm:absolute sm:right-4 sm:bottom-0 md:right-10"
          />
        </div>
      </div>

      <CategoriesMarquee shopSlug={shopSlug} categories={categories} />
    </div>
  );
}


function CategoriesMarquee({
  shopSlug,
  categories,
}: {
  shopSlug: string;
  categories: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [repeat, setRepeat] = useState(4);

  useEffect(() => {
    function recalculate() {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const setWidth = setRef.current?.offsetWidth ?? 0;
      if (!containerWidth || !setWidth) return;

      // Track needs to be at least 2x the viewport width so translateX(-1/repeat * 100%)
      // always has content to hand off to — otherwise you see the gap that caused this bug.
      const needed = Math.max(2, Math.ceil((containerWidth * 2) / setWidth));
      setRepeat(needed);
    }

    recalculate();
    const observer = new ResizeObserver(recalculate);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  const items = Array.from({ length: repeat }, () => categories).flat();

  return (
    <div
      ref={containerRef}
      className="group relative my-6 w-full overflow-hidden"
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-surface via-surface/70 to-transparent" />

      {/* Right fade */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-surface via-surface/70 to-transparent" />

      <div
        ref={setRef}
        aria-hidden
        className="pointer-events-none invisible absolute flex gap-3"
      >
        {categories.map((name) => (
          <span
            key={name}
            className="shrink-0 rounded-md px-5 py-2 text-sm font-medium"
          >
            {name}
          </span>
        ))}
      </div>

      <div
        className="flex w-max animate-marquee items-center gap-3 group-hover:paused motion-reduce:animate-none"
        style={
          {
            "--marquee-end": `-${100 / repeat}%`,
            animationDuration: `${repeat * 12}s`,
          } as React.CSSProperties
        }
      >
        {items.map((name, i) => (
          <Link
            key={`${name}-${i}`}
            href={`/stores/${shopSlug}/category/${encodeURIComponent(name)}`}
            aria-hidden={i >= categories.length}
            tabIndex={i >= categories.length ? -1 : undefined}
            className="shrink-0 rounded-md bg-muted/40 px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-neutral hover:text-white"
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}

