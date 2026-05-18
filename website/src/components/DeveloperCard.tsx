"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import type { Developer } from "@/lib/developers";

interface DeveloperCardProps {
  developer: Developer;
  index: number;
}

export default function DeveloperCard({ developer, index }: DeveloperCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTransformStyle(
      `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`,
    );
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle(
      "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    );
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className={`group relative opacity-100 rounded-2xl border border-neutral-700/80 bg-neutral-900/90 p-6 shadow-lg shadow-black/40 hover:border-emerald-500/50 hover:shadow-[0_0_50px_rgba(16,185,129,0.2)] ${
        isHovered ? "transition-none" : "transition-all duration-500 ease-out"
      }`}
      style={{
        transform:
          transformStyle ||
          "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.35), transparent 50%, rgba(16,185,129,0.15))",
          transform: "translateZ(-1px)",
        }}
        aria-hidden
      />

      <DeveloperPhoto developer={developer} isHovered={isHovered} glare={glare} />

      <div
        className="mt-6 space-y-2"
        style={{
          transform: isHovered ? "translateZ(36px)" : "translateZ(0px)",
          transition: "transform 0.35s ease-out",
        }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-500/80">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="text-2xl font-bold tracking-tight text-white">
          {developer.name}
        </h3>
        <p className="text-sm font-medium text-emerald-400/90">
          {developer.role}
        </p>
        <p className="text-sm leading-relaxed font-light text-neutral-300">
          {developer.bio}
        </p>
      </div>
    </article>
  );
}

function DeveloperPhoto({
  developer,
  isHovered,
  glare,
}: {
  developer: Developer;
  isHovered: boolean;
  glare: { x: number; y: number; opacity: number };
}) {
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-neutral-600/50 bg-neutral-800"
      style={{
        transform: isHovered ? "translateZ(48px)" : "translateZ(0px)",
        transition: "transform 0.35s ease-out",
      }}
    >
      <Image
        src={developer.image}
        alt={`Foto de ${developer.name}`}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover object-center brightness-[1.12] contrast-[1.05] saturate-[1.08]"
        priority={developer.id === "boni" || developer.id === "henrique"}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-br ${developer.accent} opacity-20`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.35) 0%, transparent 55%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/4 bg-gradient-to-t from-neutral-950/55 to-transparent"
        aria-hidden
      />
    </div>
  );
}
