"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Cpu, Eye, Code, TerminalSquare, Gamepad2 } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import HeroActionBar from "@/components/HeroActionBar";
import LevelCardsSection from "@/components/LevelCardsSection";
import { getGameCode } from "@/app/actions";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [typedTitle, setTypedTitle] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [gameCodeLoading, setGameCodeLoading] = useState(true);
  const titleText = "PIXEL MAZE";

  useEffect(() => {
    document.documentElement.toggleAttribute("data-cursor-busy", gameCodeLoading);
    return () => document.documentElement.removeAttribute("data-cursor-busy");
  }, [gameCodeLoading]);

  useEffect(() => {
    // Fetch live game code
    getGameCode()
      .then(setGameCode)
      .finally(() => setGameCodeLoading(false));
    // Looping Typewriter effect
    let currentLength = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      if (!isDeleting) {
        currentLength++;
        setTypedTitle(titleText.slice(0, currentLength));
        
        if (currentLength === titleText.length) {
          isDeleting = true;
          timeoutId = setTimeout(type, 3000); // Pause before erasing
        } else {
          timeoutId = setTimeout(type, 150); // Typing speed
        }
      } else {
        currentLength--;
        setTypedTitle(titleText.slice(0, currentLength));
        
        if (currentLength === 0) {
          isDeleting = false;
          timeoutId = setTimeout(type, 1000); // Pause before typing again
        } else {
          timeoutId = setTimeout(type, 80); // Erasing speed (faster)
        }
      }
    };

    timeoutId = setTimeout(type, 500); // Initial delay

    // Basic fluid animation for the grid background
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const x = Math.round((clientX / window.innerWidth) * 100);
      const y = Math.round((clientY / window.innerHeight) * 100);
      containerRef.current.style.setProperty("--x", `${x}%`);
      containerRef.current.style.setProperty("--y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden font-sans"
      style={{
        backgroundImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(16, 185, 129, 0.08) 0%, transparent 40%)",
      }}
    >
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Hero Section - Tela Cheia */}
      <section className="relative w-full h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 pointer-events-none mix-blend-screen"
        >
          <source src="/Maze_glitching_and_reassembling_202605121036.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-0"></div>
        <div className="absolute inset-0 bg-black/20 z-0"></div>

        <div className="relative z-10 flex flex-col items-center space-y-8 animate-fade-in-up px-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium tracking-wide backdrop-blur-sm">
            <TerminalSquare size={16} />
            <span>Procedural Generation Engine v1.0</span>
          </div>
          
          <h1 className="flex items-center justify-center space-x-4 text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[1.1] whitespace-nowrap">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-300 to-neutral-600">
              {typedTitle.length > 5 ? "PIXEL" : typedTitle}
            </span>
            {typedTitle.length > 5 && (
              <span className="text-emerald-500 inline-block hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                {typedTitle.slice(6)}
              </span>
            )}
            <span className={`text-emerald-500 ${typedTitle.length === titleText.length ? 'animate-pulse' : ''}`}>_</span>
          </h1>
          
          <p className="max-w-2xl text-lg md:text-xl text-neutral-300 leading-relaxed font-light drop-shadow-md">
            Mergulhe em um labirinto gerado proceduralmente. Um estudo de caso de algoritmos de busca, colisão AABB e renderização em pixel art, executado em tempo real.
          </p>
          
          <HeroActionBar />
        </div>
      </section>

      {/* Main Content Restrito */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-24 space-y-32">

        {/* Features / Mechanics */}
        <section id="mechanics" className="space-y-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Arquitetura do Sistema</h2>
            <div className="h-1 w-20 bg-emerald-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Cpu size={32} className="text-emerald-400" />}
              title="Geração Procedural"
              description="O mapa não é estático. Cada sessão utiliza algoritmos de geração de labirintos para criar rotas únicas, garantindo que nenhum jogo seja igual ao outro."
            />
            <FeatureCard 
              icon={<Box size={32} className="text-emerald-400" />}
              title="Colisão AABB"
              description="Um sistema robusto de Axis-Aligned Bounding Box (AABB) detecta interseções em tempo real, impedindo que o jogador atravesse paredes e gerando físicas responsivas."
            />
            <FeatureCard 
              icon={<Eye size={32} className="text-emerald-400" />}
              title="Lógica de Câmera"
              description="A viewport é calculada dinamicamente, mantendo o jogador centralizado enquanto limita a renderização às bordas do mapa, otimizando o draw call."
            />
          </div>
        </section>

        <LevelCardsSection />

        {/* Live Code and Demo Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Side: Game Code */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[600px] lg:h-[700px]">
            <div className="border-b border-neutral-800 px-6 py-4 flex justify-between items-center bg-neutral-950">
              <div className="flex items-center space-x-2">
                <Code size={18} className="text-emerald-500" />
                <span className="text-neutral-400 font-mono text-sm">game.js - Engine Logic</span>
              </div>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-black/50">
              <pre className="font-mono text-xs leading-relaxed text-emerald-300/80">
                <code>
                  {gameCode || "// Carregando lógica do motor..."}
                </code>
              </pre>
            </div>
          </div>

          {/* Right Side: Live Game Demo */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[600px] lg:h-[700px]">
            <div className="border-b border-neutral-800 px-6 py-4 flex items-center space-x-2 bg-neutral-950">
              <Gamepad2 size={18} className="text-emerald-500" />
              <span className="text-neutral-400 font-mono text-sm">Live Build - index.html</span>
            </div>
            <div className="flex-1 bg-black relative p-2 md:p-4">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-neutral-800 shadow-inner">
                {/* Overlay para impedir qualquer interação e manter a estética limpa */}
                <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"></div>
                
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  {/* Gameplay Real Demo */}
                  <source src="/Demo.mp4" type="video/mp4" />
                  Seu navegador não suporta a tag de vídeo.
                </video>

                {/* Badge "Auto-Play Demo" */}
                <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-white text-xs font-mono tracking-widest uppercase">Auto-Play Demo</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-900 py-12 mt-32 text-center text-neutral-500 text-sm">
        <p>Desenvolvido com Next.js & TailwindCSS. Awwwards Style Edition.</p>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}

