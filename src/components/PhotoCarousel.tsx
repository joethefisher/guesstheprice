"use client";

import { useState, useEffect, useRef } from "react";

interface Photo {
  url: string;
  caption?: string | null;
}

export function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [photos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function next() {
    setIndex((i) => (i + 1) % photos.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) prev();
      else next();
    }
    touchStartX.current = null;
  }

  if (!photos.length) {
    return (
      <div className="aspect-[4/3] bg-cream rounded-2xl grid place-items-center text-ink/40">
        No photos available
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] md:aspect-[16/10] bg-ink rounded-2xl overflow-hidden shadow-card group"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Photos stack */}
      {photos.map((photo, i) => (
        <img
          key={i}
          src={photo.url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-snappy ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}

      {/* Photo counter */}
      <div className="absolute top-4 right-4 bg-ink/70 backdrop-blur text-paper caption px-3 py-1.5 rounded-full">
        <span className="tnum">{index + 1}</span>
        <span className="opacity-50 mx-1">/</span>
        <span className="tnum opacity-70">{photos.length}</span>
      </div>

      {/* Nav arrows (desktop) */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper/90 backdrop-blur text-ink grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-paper hover:scale-110"
            aria-label="Previous photo"
          >
            ←
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper/90 backdrop-blur text-ink grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-paper hover:scale-110"
            aria-label="Next photo"
          >
            →
          </button>
        </>
      )}

      {/* Pagination dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ease-snappy ${
                i === index ? "w-6 bg-paper" : "w-1.5 bg-paper/40"
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
