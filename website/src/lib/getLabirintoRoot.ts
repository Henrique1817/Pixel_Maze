import fs from "fs";
import path from "path";

/**
 * Pasta do jogo em canvas (index.html, game.js, Sprites/…).
 * Não depender só de `process.cwd()/..` — o Next pode arrancar com cwd na raiz do mono-repo.
 */
export function getLabirintoRoot(): string {
  const candidates = [
    path.join(process.cwd(), ".."),
    path.join(process.cwd(), "Labirinto"),
    process.cwd(),
  ];
  for (const dir of candidates) {
    const resolved = path.resolve(dir);
    if (
      fs.existsSync(path.join(resolved, "index.html")) &&
      fs.existsSync(path.join(resolved, "game.js"))
    ) {
      return resolved;
    }
  }
  return path.resolve(process.cwd(), "..");
}

export function isPathInsideLabirintoRoot(filePath: string, root: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(filePath);
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : resolvedRoot + path.sep;
  return resolvedFile === resolvedRoot || resolvedFile.startsWith(prefix);
}
