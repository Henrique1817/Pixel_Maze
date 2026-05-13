"use client";

import React, { useRef, useState, MouseEvent } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Rotate slightly based on distance from center (max 15 degrees)
    const rotateX = ((y - centerY) / centerY) * -15; 
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`group relative p-8 bg-neutral-950 border border-neutral-900 rounded-xl hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] z-10 ${
        isHovered ? "transition-none" : "transition-all duration-500 ease-out"
      }`}
      style={{ 
        transform: transformStyle || "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)", 
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
    >
      {/* 3D Pop-out elements */}
      <div 
        className="mb-6 inline-flex p-4 rounded-lg bg-neutral-900 group-hover:bg-emerald-500/10 transition-colors duration-500"
        style={{ transform: isHovered ? "translateZ(40px)" : "translateZ(0px)", transition: "transform 0.3s ease-out" }}
      >
        {icon}
      </div>
      <h3 
        className="text-xl font-bold text-white mb-3 tracking-wide"
        style={{ transform: isHovered ? "translateZ(30px)" : "translateZ(0px)", transition: "transform 0.3s ease-out" }}
      >
        {title}
      </h3>
      <p 
        className="text-neutral-400 leading-relaxed font-light"
        style={{ transform: isHovered ? "translateZ(20px)" : "translateZ(0px)", transition: "transform 0.3s ease-out" }}
      >
        {description}
      </p>
    </div>
  );
}
