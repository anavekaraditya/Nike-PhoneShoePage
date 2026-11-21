import Gallery from "@/components/Gallery";
import PageHeader from "@/components/PageHeader";
import ProductInfo from "@/components/ProductInfo";
import PurchasePanel from "@/components/PurchasePanel";
import Reviews from "@/components/Reviews";
import TechCopy from "@/components/TechCopy";
import { getProduct } from "@/lib/sizes";

/**
 * Page order (top to bottom), per the page plan:
 * 0 header, 1 name/price/colorway, 2 photos, 3 size selector,
 * 4 Add to Bag (inside the purchase panel), 5 tech copy, 6 reviews.
 */
export default function Home() {
  const product = getProduct();

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-white">
      <PageHeader />
      <ProductInfo product={product} />
      <Gallery />
      <PurchasePanel sizes={product.sizes} />
      <TechCopy product={product} />
      <Reviews />
    </main>
  );
}
