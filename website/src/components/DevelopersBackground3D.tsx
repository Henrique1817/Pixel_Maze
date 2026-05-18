"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const CUBES = [
  { size: 72, x: "8%", y: "18%", delay: 0, color: "rgba(16, 185, 129, 0.12)" },
  { size: 48, x: "88%", y: "22%", delay: 0.4, color: "rgba(16, 185, 129, 0.08)" },
  { size: 96, x: "92%", y: "68%", delay: 0.8, color: "rgba(52, 211, 153, 0.1)" },
  { size: 56, x: "12%", y: "72%", delay: 1.2, color: "rgba(16, 185, 129, 0.09)" },
  { size: 40, x: "50%", y: "8%", delay: 0.6, color: "rgba(255, 255, 255, 0.04)" },
];

export default function DevelopersBackground3D() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const cubes = scene.querySelectorAll<HTMLElement>("[data-cube]");
    const ctx = gsap.context(() => {
      cubes.forEach((cube, i) => {
        gsap.to(cube, {
          rotationX: 360,
          rotationY: 360,
          duration: 18 + i * 4,
          repeat: -1,
          ease: "none",
        });
        gsap.to(cube, {
          y: "+=24",
          duration: 3 + i * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: CUBES[i]?.delay ?? 0,
        });
      });

      gsap.to(scene, {
        rotationY: 8,
        rotationX: -4,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        transformPerspective: 1200,
      });
    }, scene);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sceneRef}
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-60"
      style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      aria-hidden
    >
      {CUBES.map((cube, i) => (
        <div
          key={i}
          data-cube
          className="absolute border border-emerald-500/20"
          style={{
            left: cube.x,
            top: cube.y,
            width: cube.size,
            height: cube.size,
            backgroundColor: cube.color,
            transformStyle: "preserve-3d",
            boxShadow: "0 0 40px rgba(16, 185, 129, 0.08)",
          }}
        />
      ))}

      <div
        className="absolute left-1/2 top-1/2 h-[min(80vw,520px)] w-[min(80vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/10"
        style={{
          transform: "translateZ(-120px) rotateX(75deg)",
          background:
            "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
