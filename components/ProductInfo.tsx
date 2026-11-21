import type { Product } from "@/lib/sizes";

/** Name, price and colorway. Reserved height keeps the photo from shifting. */
export default function ProductInfo({ product }: { product: Product }) {
  return (
    <section className="flex min-h-[112px] flex-col justify-center px-4 py-4">
      <p className="text-sm text-neutral-600">Style {product.styleCode}</p>
      <h1 className="mt-0.5 text-2xl font-semibold leading-tight">
        {product.name}
      </h1>
      <p data-testid="price" className="mt-1 text-lg font-medium">
        {product.priceFormatted}
      </p>
      <p className="text-sm text-neutral-600">{product.colorway}</p>
    </section>
  );
}
