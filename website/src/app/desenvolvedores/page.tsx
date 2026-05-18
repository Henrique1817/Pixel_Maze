"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, Code2, Users } from "lucide-react";
import gsap from "gsap";
import DeveloperCard from "@/components/DeveloperCard";
import DevelopersBackground3D from "@/components/DevelopersBackground3D";
import { DEVELOPERS } from "@/lib/developers";

export default function DesenvolvedoresPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      containerRef.current.style.setProperty("--x", `${x}%`);
      containerRef.current.style.setProperty("--y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.from(heroRef.current.children, {
          y: 32,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
        });
      }
      if (gridRef.current) {
        gsap.from(gridRef.current.children, {
          y: 48,
          rotateX: -6,
          duration: 0.85,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.25,
          transformPerspective: 1000,
          clearProps: "opacity",
        });
      }
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-neutral-950 font-sans text-white selection:bg-emerald-500/30"
      style={{
        backgroundImage:
          "radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(16, 185, 129, 0.22) 0%, transparent 50%), linear-gradient(180deg, #0f1412 0%, #0a0a0a 45%, #050505 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <DevelopersBackground3D />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 rounded-sm border border-neutral-800 bg-neutral-950/80 px-4 py-2 text-sm font-medium uppercase tracking-wider text-neutral-300 backdrop-blur-sm transition-colors hover:border-emerald-500/40 hover:text-white"
        >
          <ArrowLeft size={16} className="text-emerald-500" />
          Voltar ao início
        </Link>

        <header ref={heroRef} className="mb-20 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium tracking-wide text-emerald-400 backdrop-blur-sm">
            <Users size={16} />
            <span>Pixel Maze Team</span>
          </div>

          <h1 className="text-5xl font-black tracking-tighter md:text-7xl">
            <span className="bg-gradient-to-br from-white via-neutral-300 to-neutral-600 bg-clip-text text-transparent">
              Desenvolvedores
            </span>
            <span className="text-emerald-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.45)]">
              _
            </span>
          </h1>

          <p className="text-lg font-light leading-relaxed text-neutral-300 md:text-xl">
            A equipe por trás do labirinto procedural — engine, interface, níveis e
            identidade visual. Passe o mouse nos cards para ver o efeito 3D.
          </p>

          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-neutral-400">
            <Code2 size={14} className="text-emerald-500" />
            <span>{DEVELOPERS.length} membros · Next.js · Canvas Engine</span>
          </div>
        </header>

        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          style={{ perspective: "1400px" }}
        >
          {DEVELOPERS.map((dev, index) => (
            <DeveloperCard key={dev.id} developer={dev} index={index} />
          ))}
        </div>
      </div>

      <footer className="relative z-10 border-t border-neutral-900 py-12 text-center text-sm text-neutral-500">
        <p>Pixel Maze — equipe de desenvolvimento.</p>
      </footer>
    </div>
  );
}
