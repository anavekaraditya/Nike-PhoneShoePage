import type { Product } from "@/lib/sizes";

function Row({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-neutral-200">
      <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-base font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          aria-hidden
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="pb-4 text-sm leading-6 text-neutral-700">{children}</div>
    </details>
  );
}

export default function TechCopy({ product }: { product: Product }) {
  const first = product.sizes[0];
  const last = product.sizes[product.sizes.length - 1];

  return (
    <section aria-label="Product information" className="px-4 pt-6">
      {/* Summary: clamped to 4 lines inside a reserved-height block. */}
      <p className="line-clamp-4 min-h-24 text-base leading-6">
        {product.name} in {product.colorway}, style {product.styleCode}. Available
        in {product.sizes.length} sizes, from {first.label} to {last.label}, at{" "}
        {product.priceFormatted}.
      </p>

      <div className="mt-2 border-t border-neutral-200">
        <Row title="Product details" defaultOpen>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            <dt className="text-neutral-500">Product</dt>
            <dd>{product.name}</dd>
            <dt className="text-neutral-500">Style</dt>
            <dd>{product.styleCode}</dd>
            <dt className="text-neutral-500">Colorway</dt>
            <dd>{product.colorway}</dd>
            <dt className="text-neutral-500">Price</dt>
            <dd>{product.priceFormatted}</dd>
            <dt className="text-neutral-500">Launch date</dt>
            <dd>{product.launchDateFormatted}</dd>
            <dt className="text-neutral-500">Sizes</dt>
            <dd>
              {product.sizes.length} ({first.label} to {last.label})
            </dd>
            <dt className="text-neutral-500">EU range</dt>
            <dd>
              {first.sizeEu} to {last.sizeEu}
            </dd>
          </dl>
        </Row>
        <Row title="Tech specs">
          <p className="text-neutral-500">
            Placeholder: add the shoe&rsquo;s tech spec copy here (drop,
            cushioning, upper, weight).
          </p>
        </Row>
        <Row title="Shipping and returns">
          <p className="text-neutral-500">
            Placeholder: add shipping and returns copy here.
          </p>
        </Row>
      </div>
    </section>
  );
}
