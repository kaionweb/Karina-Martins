"use client";

import { useMemo } from "react";

type Star = { id: number; x: number; y: number; size: number; delay: number };

function generateStars(count: number, sizeScale: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const rand = (offset: number) => (((seed + offset) * 9301 + 49297) % 233280) / 233280;
    return {
      id: i,
      x: rand(1) * 100,
      y: rand(2) * 100,
      size: rand(3) * sizeScale + 0.5,
      delay: rand(4) * 4,
    };
  });
}

export function StarField({ count = 70, sizeScale = 2 }: { count?: number; sizeScale?: number }) {
  const stars = useMemo(() => generateStars(count, sizeScale), [count, sizeScale]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
