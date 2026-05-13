/**
 * Gera um snapshot do mapa com o mesmo algoritmo Kruskal aleatorizado que `game.js` (`generateMaze`).
 * PRNG determinístico para pré-visualizações estáveis no site.
 */

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
}

export function generateMazeSnapshot(cols: number, rows: number, seed: number): number[][] {
  const rand = createMulberry32(seed);
  const map: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(1));

  const strideX = Math.floor((cols - 1) / 2);
  const V = strideX * Math.floor((rows - 1) / 2);
  const parent = new Uint32Array(V);
  for (let i = 0; i < V; i++) parent[i] = i;

  function find(i: number): number {
    let r = i;
    while (parent[r] !== r) r = parent[r];
    let x = i;
    while (parent[x] !== r) {
      const n = parent[x];
      parent[x] = r;
      x = n;
    }
    return r;
  }

  function unionSet(a: number, b: number): boolean {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[rb] = ra;
    return true;
  }

  function cellId(x: number, y: number): number {
    return ((y - 1) >> 1) * strideX + ((x - 1) >> 1);
  }

  type Edge = { x1: number; y1: number; x2: number; y2: number; wx: number; wy: number };
  const edges: Edge[] = [];
  for (let y = 1; y < rows - 1; y += 2) {
    for (let x = 1; x < cols - 1; x += 2) {
      if (x + 2 < cols - 1) {
        edges.push({ x1: x, y1: y, x2: x + 2, y2: y, wx: x + 1, wy: y });
      }
      if (y + 2 < rows - 1) {
        edges.push({ x1: x, y1: y, x2: x, y2: y + 2, wx: x, wy: y + 1 });
      }
    }
  }

  shuffleInPlace(edges, rand);
  for (const e of edges) {
    const a = cellId(e.x1, e.y1);
    const b = cellId(e.x2, e.y2);
    if (!unionSet(a, b)) continue;
    map[e.y1]![e.x1] = 0;
    map[e.y2]![e.x2] = 0;
    map[e.wy]![e.wx] = 0;
  }

  map[0]![1] = 0;
  map[1]![1] = 0;
  map[rows - 1]![cols - 2] = 0;
  map[rows - 2]![cols - 2] = 0;

  return map;
}
