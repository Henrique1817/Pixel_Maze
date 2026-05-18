"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Gamepad2, Users } from "lucide-react";

const PLAY_GAME_HREF = "/api/game/index.html";

/**
 * Evita avisos de hidratação quando o HTML pré-renderizado fica desfasado do bundle
 * (ex.: cache do Turbopack): o 1.º paint usa um placeholder estável; os CTAs aparecem no cliente.
 */
export default function HeroActionBar() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="flex min-h-[3.75rem] flex-col flex-wrap items-center justify-center gap-4 pt-8 sm:flex-row sm:gap-6"
        aria-hidden
      >
        <div className="h-14 w-[min(100%,17.5rem)] max-w-full rounded-sm bg-emerald-500/15" />
        <div className="h-14 w-40 rounded-sm bg-neutral-800/50" />
        <div className="h-14 w-44 rounded-sm bg-neutral-800/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-wrap items-center justify-center gap-4 pt-8 sm:flex-row sm:gap-6">
      <a
        href={PLAY_GAME_HREF}
        className="group relative inline-flex items-center justify-center space-x-2 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider transition-all duration-300 rounded-sm overflow-hidden"
      >
        <span className="relative z-10 flex items-center space-x-2">
          <Gamepad2 size={20} />
          <span>Jogar Agora</span>
        </span>
        <div className="absolute inset-0 h-full w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full z-0" />
      </a>
      <a
        href="#mechanics"
        className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white font-medium uppercase tracking-wider transition-all duration-300 rounded-sm text-sm"
      >
        <ArrowRight size={18} className="text-neutral-500" />
        <span>Arquitetura</span>
      </a>
      <a
        href="#levels"
        className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 text-white font-medium uppercase tracking-wider transition-all duration-300 rounded-sm text-sm"
      >
        <ArrowRight size={18} className="text-emerald-500/80" />
        <span>Níveis & demos</span>
      </a>
      <a
        href="/desenvolvedores"
        className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 text-white font-medium uppercase tracking-wider transition-all duration-300 rounded-sm text-sm"
      >
        <Users size={18} className="text-emerald-500/80" />
        <span>Equipe</span>
      </a>
    </div>
  );
}
