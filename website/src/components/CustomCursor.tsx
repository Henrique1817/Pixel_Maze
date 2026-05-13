"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

type CursorKey = "nomal" | "click" | "text" | "help" | "invalid" | "busy";

const CURSOR: Record<
  CursorKey,
  { src: string; w: number; h: number; hx: number; hy: number }
> = {
  nomal: { src: "/Cursor/nomal.png", w: 131, h: 149, hx: 65, hy: 74 },
  click: { src: "/Cursor/click.png", w: 179, h: 179, hx: 89, hy: 89 },
  text: { src: "/Cursor/text_selecte.png", w: 90, h: 201, hx: 45, hy: 100 },
  help: { src: "/Cursor/help.png", w: 161, h: 247, hx: 80, hy: 123 },
  invalid: { src: "/Cursor/invalido.png", w: 214, h: 185, hx: 107, hy: 92 },
  busy: { src: "/Cursor/busy.png", w: 215, h: 217, hx: 107, hy: 108 },
};

/** Lado máximo (px) do sprite no ecrã — menor = cursor mais discreto */
const MAX_DISPLAY = 30;

function scaleCursor(c: (typeof CURSOR)[CursorKey]) {
  const s = Math.min(1, MAX_DISPLAY / Math.max(c.w, c.h));
  return {
    dw: c.w * s,
    dh: c.h * s,
    hx: c.hx * s,
    hy: c.hy * s,
  };
}

function eventTargetToElement(t: EventTarget | null): Element | null {
  if (!t || typeof Node === "undefined") return null;
  if (t instanceof Element) return t;
  const n = t as Node;
  return n.parentElement;
}

function isInvalidNode(node: Element): boolean {
  if (node.classList.contains("cursor-not-allowed")) return true;
  if (node.getAttribute("aria-disabled") === "true") return true;
  if (node.hasAttribute("disabled")) return true;
  if (node instanceof HTMLButtonElement && node.disabled) return true;
  if (node instanceof HTMLInputElement && node.disabled) return true;
  if (node instanceof HTMLSelectElement && node.disabled) return true;
  if (node instanceof HTMLTextAreaElement && node.disabled) return true;
  if (node instanceof HTMLOptionElement && node.disabled) return true;
  return false;
}

/** Há texto realmente selecionado (página ou campo com foco). */
function hasActiveTextSelection(): boolean {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    return true;
  }
  const ae = document.activeElement;
  if (ae instanceof HTMLInputElement || ae instanceof HTMLTextAreaElement) {
    const a = ae.selectionStart;
    const b = ae.selectionEnd;
    if (a != null && b != null && a !== b) {
      return true;
    }
  }
  return false;
}

function resolveCursor(el: Element | null): CursorKey {
  if (document.documentElement.hasAttribute("data-cursor-busy")) {
    return "busy";
  }

  if (hasActiveTextSelection()) {
    return "text";
  }

  if (!el) return "nomal";

  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && node.classList.contains("cursor-wait")) {
      return "busy";
    }
    if (isInvalidNode(node)) return "invalid";
    if (node.matches(".cursor-help, abbr[title]")) return "help";
    if (
      node.matches(
        'input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]:not([contenteditable="false"])',
      )
    ) {
      return "text";
    }
    if (
      node.matches(
        'a[href], button, [role="button"], summary, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="file"], select, label[for]',
      )
    ) {
      return "click";
    }
    node = node.parentElement;
  }
  return "nomal";
}

export default function CustomCursor() {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [key, setKey] = useState<CursorKey>("nomal");
  const raf = useRef(0);
  const lastPoint = useRef({ x: 0, y: 0 });

  const refreshFromPoint = useCallback(() => {
    const { x, y } = lastPoint.current;
    const el = document.elementFromPoint(x, y);
    setKey(resolveCursor(el));
  }, []);

  const onMove = useCallback(
    (e: MouseEvent) => {
      lastPoint.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        setPos(lastPoint.current);
        const el = eventTargetToElement(e.target);
        setKey(resolveCursor(el));
      });
    },
    [],
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const html = document.documentElement;
    html.classList.add("custom-cursor-active");

    const cx = Math.floor(window.innerWidth / 2);
    const cy = Math.floor(window.innerHeight / 2);
    lastPoint.current = { x: cx, y: cy };
    // Inicialização síncrona antes do paint: cursor nativo oculto precisa do <img> visível no mesmo frame.
    /* eslint-disable react-hooks/set-state-in-effect -- init única do overlay + leitura do elemento sob o centro */
    setPos({ x: cx, y: cy });
    const under = document.elementFromPoint(cx, cy);
    setKey(resolveCursor(under));
    setActive(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    const obs = new MutationObserver(() => {
      refreshFromPoint();
    });
    obs.observe(html, { attributes: true, attributeFilter: ["data-cursor-busy"] });

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("scroll", refreshFromPoint, { passive: true, capture: true });
    document.addEventListener("selectionchange", refreshFromPoint);

    return () => {
      obs.disconnect();
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("scroll", refreshFromPoint, true);
      document.removeEventListener("selectionchange", refreshFromPoint);
      cancelAnimationFrame(raf.current);
      html.classList.remove("custom-cursor-active");
      setActive(false);
    };
  }, [onMove, refreshFromPoint]);

  if (!active) return null;

  const cfg = CURSOR[key];
  const { dw, dh, hx, hy } = scaleCursor(cfg);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- cursor em tempo real; next/image não se aplica
    <img
      src={cfg.src}
      alt=""
      aria-hidden={true}
      draggable={false}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: dw,
        height: dh,
        transform: `translate3d(${pos.x - hx}px, ${pos.y - hy}px, 0)`,
        imageRendering: "pixelated",
        pointerEvents: "none",
        zIndex: 2147483647,
        willChange: "transform",
      }}
    />
  );
}
