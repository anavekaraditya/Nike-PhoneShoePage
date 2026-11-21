"use client";

import { useRef, useState } from "react";
import type { SizeOption } from "@/lib/sizes";

type Note =
  | { kind: "sold_out"; sku: string }
  | { kind: "low_stock"; sku: string }
  | { kind: "error" }
  | { kind: "added"; sku: string }
  | null;

function ariaLabel(size: SizeOption) {
  const base = `Size ${size.label}, EU ${size.sizeEu}`;
  if (size.status === "sold_out") return `${base}, out of stock`;
  if (size.status === "low_stock") return `${base}, just a few left`;
  return base;
}

export default function PurchasePanel({ sizes }: { sizes: SizeOption[] }) {
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [notified, setNotified] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const selected = sizes.find((s) => s.sku === selectedSku) ?? null;
  const bySku = (sku: string) => sizes.find((s) => s.sku === sku);

  function selectSize(size: SizeOption) {
    // Sold-out sizes are tappable: they answer instead of selecting.
    if (size.status === "sold_out") {
      setNote({ kind: "sold_out", sku: size.sku });
      return;
    }
    setSelectedSku(size.sku);
    setNote(size.status === "low_stock" ? { kind: "low_stock", sku: size.sku } : null);
  }

  function addToBag() {
    if (!selected) {
      setNote({ kind: "error" });
      setShaking(true);
      gridRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setNote({ kind: "added", sku: selected.sku });
  }

  function renderNote() {
    if (!note) return null;
    if (note.kind === "error") {
      return <p className="font-medium text-red-600">Select a size.</p>;
    }
    const size = bySku(note.sku);
    if (!size) return null;
    if (note.kind === "sold_out") {
      const isNotified = notified.includes(size.sku);
      return (
        <div className="flex items-center justify-between gap-3">
          <p>
            <span className="font-medium">{size.label}</span> is out of stock.
          </p>
          <button
            type="button"
            disabled={isNotified}
            onClick={() => setNotified((n) => [...n, size.sku])}
            className="h-12 shrink-0 rounded-full border border-black px-4 text-sm font-medium disabled:border-neutral-300 disabled:text-neutral-500"
          >
            {isNotified ? "We'll let you know" : "Notify me"}
          </button>
        </div>
      );
    }
    if (note.kind === "low_stock") {
      return (
        <p className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full bg-amber-500"
          />
          <span className="font-medium">Just a few left. Order soon.</span>
        </p>
      );
    }
    return (
      <p>
        Added <span className="font-medium">{size.label}</span> to your bag.
      </p>
    );
  }

  return (
    <section id="size" aria-label="Select size" className="relative pt-6">
      <div className="px-4 pb-3">
        <h2 className="text-lg font-semibold">Select Size</h2>
      </div>

      <div
        ref={gridRef}
        role="radiogroup"
        aria-label="Select size"
        onAnimationEnd={() => setShaking(false)}
        className={`grid grid-cols-2 gap-2 px-4 ${
          shaking ? "animate-shake motion-reduce:animate-none" : ""
        }`}
      >
        {sizes.map((size) => {
          const isSelected = size.sku === selectedSku;
          const soldOut = size.status === "sold_out";
          return (
            <button
              key={size.sku}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={soldOut || undefined}
              aria-label={ariaLabel(size)}
              onClick={() => selectSize(size)}
              // Same box in every state: 48 high, full column wide (167.5 at 375).
              className={`relative flex h-12 w-full flex-col items-center justify-center rounded-lg px-2 text-center leading-tight ${
                soldOut
                  ? // Sold out: dashed border, light fill, muted text. Same box size.
                    "border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500"
                  : isSelected
                    ? "text-neutral-900 ring-2 ring-inset ring-black"
                    : "text-neutral-900 ring-1 ring-inset ring-neutral-300"
              }`}
            >
              <span className="text-[15px] font-semibold">{size.label}</span>
              <span className="text-xs text-neutral-500">EU {size.sizeEu}</span>
              {/* Low-stock corner indicator: stays visible when selected. */}
              {size.status === "low_stock" && (
                <span
                  aria-hidden
                  className="absolute right-2 top-2 size-2 rounded-full bg-amber-500"
                />
              )}
              {isSelected && (
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className="absolute left-1.5 top-1.5 size-3.5 rounded-full bg-black p-0.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* One reserved message line so the layout never moves. */}
      <div
        role="status"
        aria-live="polite"
        // Fixed 64 px (48 px Notify me button + padding) so no message moves the page.
        className="flex h-16 items-center px-4 text-sm"
      >
        {renderNote()}
      </div>

      {/* Add to Bag sits right after the selector and stays pinned to the
          bottom of the screen while the size grid is on screen. */}
      <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={addToBag}
          className="h-[52px] w-full rounded-full bg-black text-base font-medium text-white active:bg-neutral-800"
        >
          {selected ? `Add to Bag · ${selected.label}` : "Add to Bag"}
        </button>
      </div>
    </section>
  );
}
