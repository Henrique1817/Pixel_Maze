"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Clock, Grid3x3, Sparkles } from "lucide-react";
import { generateMazeSnapshot } from "@/lib/mazeKruskalPreview";

const PLAY_GAME_HREF = "/api/game/index.html";

export type DifficultyId = "easy" | "medium" | "hard" | "impossible";

export const LEVELS: Record<
  DifficultyId,
  {
    title: string;
    cols: number;
    rows: number;
    timeSec: number;
    description: string;
    /** Semente fixa só para o desenho do card (cada nível tem um labirinto de exemplo estável). */
    previewSeed: number;
    accent: string;
  }
> = {
  easy: {
    title: "Fácil",
    cols: 15,
    rows: 15,
    timeSec: 240,
    description:
      "Grelha 15×15 e 4 minutos no relógio. Bom para aprender controles e ler o mapa sem pressão extrema.",
    previewSeed: 0x0ea51e01,
    accent: "from-emerald-500/20 to-transparent",
  },
  medium: {
    title: "Médio",
    cols: 25,
    rows: 25,
    timeSec: 180,
    description:
      "25×25 com 3 minutos. Mais corredores e becos — o mesmo motor Kruskal, maior densidade espacial.",
    previewSeed: 0x0d15ea5e,
    accent: "from-cyan-500/15 to-transparent",
  },
  hard: {
    title: "Difícil",
    cols: 35,
    rows: 35,
    timeSec: 105,
    description:
      "35×35 e 1:45. Labirinto grande; exige memória de rota e leitura rápida do canvas.",
    previewSeed: 0x0badf00d,
    accent: "from-amber-500/15 to-transparent",
  },
  impossible: {
    title: "Impossível",
    cols: 35,
    rows: 35,
    timeSec: 120,
    description:
      "Mesma grelha que Difícil, com regras extras no jogo: visão limitada e mutações mais apertadas — o mapa abaixo mostra só a topologia base.",
    previewSeed: 0xdeadbeef,
    accent: "from-rose-500/20 to-transparent",
  },
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LevelPreviewCanvas({ map }: { map: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rows = map.length;
  const cols = map[0]?.length ?? 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cols < 1 || rows < 1) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 4 || h < 4) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ts = Math.floor(Math.min(w / cols, h / rows));
    const ox = Math.floor((w - ts * cols) / 2);
    const oy = Math.floor((h - ts * rows) / 2);

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = map[y]![x]!;
        ctx.fillStyle = cell === 1 ? "#0f172a" : "#064e3b";
        ctx.fillRect(ox + x * ts, oy + y * ts, ts, ts);
        if (cell === 0 && ts >= 3) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
          ctx.fillRect(ox + x * ts, oy + y * ts, ts, ts);
        }
      }
    }

    const mark = (x: number, y: number, fill: string, stroke: string) => {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1, ts / 10);
      const pad = Math.max(1, ts / 8);
      ctx.fillRect(ox + x * ts + pad, oy + y * ts + pad, ts - pad * 2, ts - pad * 2);
      ctx.strokeRect(ox + x * ts + pad, oy + y * ts + pad, ts - pad * 2, ts - pad * 2);
    };
    mark(1, 0, "rgba(34, 197, 94, 0.45)", "#4ade80");
    mark(1, 1, "rgba(34, 197, 94, 0.25)", "#4ade80");
    mark(cols - 2, rows - 1, "rgba(234, 179, 8, 0.45)", "#facc15");
    mark(cols - 2, rows - 2, "rgba(234, 179, 8, 0.25)", "#facc15");
  }, [map, cols, rows]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-lg" aria-hidden />;
}

function LevelCard({ id, cfg }: { id: DifficultyId; cfg: (typeof LEVELS)[DifficultyId] }) {
  const map = useMemo(
    () => generateMazeSnapshot(cfg.cols, cfg.rows, cfg.previewSeed),
    [cfg.cols, cfg.rows, cfg.previewSeed],
  );

  const playHref = `${PLAY_GAME_HREF}?difficulty=${encodeURIComponent(id)}`;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/90 bg-gradient-to-br ${cfg.accent} p-5 shadow-xl backdrop-blur-sm transition-transform hover:-translate-y-0.5`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[12px_12px]" />

      <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-neutral-800 bg-black">
        <LevelPreviewCanvas map={map} />
      </div>

      <div className="relative mt-5 flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold tracking-tight text-white">{cfg.title}</h3>
        <Sparkles className="h-5 w-5 shrink-0 text-emerald-500/60 opacity-60 group-hover:opacity-100" aria-hidden />
      </div>

      <div className="relative mt-3 flex flex-wrap gap-3 text-xs text-neutral-400">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-black/40 px-2 py-1 font-mono">
          <Grid3x3 size={12} className="text-emerald-500/80" />
          {cfg.cols}×{cfg.rows}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-black/40 px-2 py-1 font-mono">
          <Clock size={12} className="text-emerald-500/80" />
          {formatTime(cfg.timeSec)}
        </span>
      </div>

      <p className="relative mt-4 flex-1 text-sm leading-relaxed text-neutral-400">{cfg.description}</p>

      <a
        href={playHref}
        className="relative mt-5 inline-flex w-full items-center justify-center rounded-md border border-emerald-600/40 bg-emerald-600/15 py-2.5 text-center text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-600/25"
      >
        Jogar — {cfg.title}
      </a>
    </article>
  );
}

export default function LevelCardsSection() {
  const order: DifficultyId[] = ["easy", "medium", "hard", "impossible"];

  return (
    <section id="levels" className="scroll-mt-24 space-y-10">
      <div className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-500/90">Níveis</p>
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Cada dificuldade, com demonstração
        </h2>
        <p className="max-w-2xl text-neutral-400">
          Os quadrados usam o mesmo gerador Kruskal do jogo (uma semente fixa por card só para o
          desenho). Ao clicares em jogar, o nível já fica pré-selecionado no menu do labirinto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {order.map((id) => (
          <LevelCard key={id} id={id} cfg={LEVELS[id]} />
        ))}
      </div>
    </section>
  );
}
