/**
 * No review data was supplied, so this shows an empty state inside the
 * reserved space. Wire real reviews in here (summary row + 3 cards).
 */
export default function Reviews() {
  return (
    <section
      aria-label="Reviews"
      className="px-4 pb-[calc(32px+env(safe-area-inset-bottom))] pt-8"
    >
      <h2 className="text-lg font-semibold">Reviews</h2>
      <div className="mt-4 flex min-h-[280px] flex-col items-center justify-center rounded-lg bg-neutral-100 px-6 text-center">
        <p className="font-medium">No reviews yet</p>
        <p className="mt-1 text-sm text-neutral-600">
          Ratings and reviews will appear here once this shoe is out.
        </p>
      </div>
    </section>
  );
}
