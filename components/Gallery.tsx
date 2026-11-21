"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// Add more photos here and the carousel, dots and counter appear on their own.
const photos = [
  {
    src: "/images/pegasus-43-1.webp",
    alt: "Nike Pegasus 43 in black and white, side view",
  },
];

export default function Gallery() {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = photos.length > 1;

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section aria-label="Product photos" className="relative">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, i) => (
          // Fixed 4:5 box, reserved before the image loads.
          <div
            key={photo.src}
            className="relative aspect-[4/5] w-full shrink-0 snap-center bg-neutral-100"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 430px) 100vw, 430px"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {many && (
        <>
          <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">
            {index + 1}/{photos.length}
          </span>
          <div className="absolute inset-x-0 bottom-1 flex justify-center">
            {photos.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className="flex size-6 items-center justify-center"
              >
                <span
                  className={`size-2 rounded-full ${
                    i === index ? "bg-black" : "bg-neutral-400"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
