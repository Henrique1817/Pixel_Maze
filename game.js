// Configuração do Canvas
const canvasEl = document.getElementById('gameCanvas');
if (!(canvasEl instanceof HTMLCanvasElement)) {
    throw new Error('Canvas not found');
}
// Este type funciona como um type guard, garantindo que o canvas é um HTMLCanvasElement
 /** @type {HTMLCanvasElement} */
const canvas = canvasEl || null;

const ctxEl = canvas.getContext('2d');
if (!ctxEl) throw new Error('Context not found');

// Este type funciona como um type guard, garantindo que o contexto é um CanvasRenderingContext2D
/** @type {CanvasRenderingContext2D} */
const ctx = ctxEl;

/** Buffer offscreen: mundo iluminado no modo impossível (revelado só dentro dos círculos). */
/** @type {HTMLCanvasElement | null} */
let visionBuffer = null;

/**
 * @param {number} w
 * @param {number} h
 * @returns {HTMLCanvasElement}
 */
function ensureVisionBuffer(w, h) {
    if (!visionBuffer || visionBuffer.width !== w || visionBuffer.height !== h) {
        visionBuffer = document.createElement('canvas');
        visionBuffer.width = w;
        visionBuffer.height = h;
    }
    return visionBuffer;
}

// Imagens (Sprites)
const imgMuro = new Image();
imgMuro.src = 'Sprites/muro.png';

const imgGrama = new Image();
imgGrama.src = 'Sprites/grama.png';

const imgMato = new Image();
imgMato.src = 'Sprites/mato.png';

const imgStart = new Image();
imgStart.src = 'Sprites/Sem_fundo/start-removebg-preview.png';

const imgEnd = new Image();
imgEnd.src = 'Sprites/Sem_fundo/end-removebg-preview.png';

/** Escala visual dos portões (1 = um tile; centrado no tile). */
const GATE_SPRITE_SCALE = 1.85;
/** Raio extra de luz nos portões no modo impossível (multiplicador de ts). */
const GATE_VISION_MARK_SCALE = 2.5;
/** Largura/altura do sprite do jogador em fração do tile. */
const PLAYER_SPRITE_SCALE = 0.88;

/** @param {string} src */
function loadPersonaSprite(src) {
    const im = new Image();
    im.src = src;
    return im;
}

/** Pares [frame0, frame1]; sprites sem fundo. */
const PERSONA_BASE = 'Sprites/persona/Sem%20fundo';

const PLAYER_WALK = {
    up: [
        loadPersonaSprite(`${PERSONA_BASE}/costas_direita-removebg-preview.png`),
        loadPersonaSprite(`${PERSONA_BASE}/costas_esquerda-removebg-preview.png`)
    ],
    down: [
        loadPersonaSprite(`${PERSONA_BASE}/frente_direita-removebg-preview.png`),
        loadPersonaSprite(`${PERSONA_BASE}/frente_esquerda-removebg-preview.png`)
    ],
    right: [
        loadPersonaSprite(`${PERSONA_BASE}/lado_direita_direita-removebg-preview.png`),
        loadPersonaSprite(`${PERSONA_BASE}/lado_direita_esquerda-removebg-preview.png`)
    ],
    left: [
        loadPersonaSprite(`${PERSONA_BASE}/lado_esqueda_esquerda-removebg-preview.png`),
        loadPersonaSprite(`${PERSONA_BASE}/lado_esquerda_direita-removebg-preview.png`)
    ]
};

/** ms por troca de frame ao andar */
const PLAYER_WALK_FRAME_MS = 88;

// Elementos da UI
const mainMenu = document.getElementById('main-menu');
const winScreen = document.getElementById('win-screen');
const hud = document.getElementById('hud') || null;
const btnStart = document.getElementById('btn-start') || null;
const btnRestart = document.getElementById('btn-restart') || null;
const btnQuit = document.getElementById('btn-quit') || null;
const btnFullscreen = document.getElementById('btn-fullscreen') || null;
const selectDifficulty = /** @type {HTMLSelectElement | null} */ (document.getElementById('difficulty'));
const timerDisplay = document.getElementById('timer-display') || null;
const diffDisplay = document.getElementById('diff-display') || null;

// Idioma: <html lang="..."> ou navegador (prefixo pt → PT, caso contrário EN)
const GAME_LOCALE = (() => {
    const raw = (
        document.documentElement.getAttribute('lang') ||
        (typeof navigator !== 'undefined' ? navigator.language : '') ||
        'pt'
    ).toLowerCase();
    return raw.startsWith('pt') ? 'pt' : 'en';
})();

/** Textos dos níveis por locale (HUD + opções do select). */
const LEVEL_I18N = {
    pt: {
        easy: { hud: 'FÁCIL', option: 'Fácil (4 min, grelha pequena)' },
        medium: { hud: 'MÉDIO', option: 'Médio (3 min, grelha média)' },
        hard: { hud: 'DIFÍCIL', option: 'Difícil (1:45, grelha grande)' },
        impossible: { hud: 'IMPOSSÍVEL', option: 'Impossível (2 min, visão curta)' }
    },
    en: {
        easy: { hud: 'EASY', option: 'Easy (4 min, small grid)' },
        medium: { hud: 'MEDIUM', option: 'Medium (3 min, medium grid)' },
        hard: { hud: 'HARD', option: 'Hard (1:45, large grid)' },
        impossible: { hud: 'IMPOSSIBLE', option: 'Impossible (2 min, short vision)' }
    }
};

/**
 * @param {string} key easy | medium | hard | impossible
 * @param {'hud'|'option'} field
 */
function levelText(key, field) {
    const pack = LEVEL_I18N[GAME_LOCALE] || LEVEL_I18N.pt;
    const row = pack[/** @type {keyof typeof LEVEL_I18N.pt} */ (key)];
    return row ? row[field] : key;
}

/** Atualiza os rótulos do <select> e o HUD da dificuldade no menu. */
function applyLocalizedLevelLabels() {
    if (!selectDifficulty) return;
    const keys = ['easy', 'medium', 'hard', 'impossible'];
    for (const key of keys) {
        const opt = selectDifficulty.querySelector(`option[value="${key}"]`);
        if (opt) opt.textContent = levelText(key, 'option');
    }
    if (diffDisplay) {
        const v = selectDifficulty.value;
        const k = Object.prototype.hasOwnProperty.call(CONFIG, v) ? v : 'easy';
        diffDisplay.textContent = levelText(k, 'hud');
    }
}

// Configurações por dificuldade (nomes exibidos vêm de LEVEL_I18N + GAME_LOCALE)
/** @type {Record<string, { cols: number, rows: number, time: number }>} */
const CONFIG = {
    easy: { cols: 15, rows: 15, time: 240 }, // 240s = 4 min
    medium: { cols: 25, rows: 25, time: 180 }, // 180s = 3 min
    hard: { cols: 35, rows: 35, time: 105 }, // 105s = 1:45
    /** Mesmo grid que difícil; visão curta + entrada/saída; ciclo de mutação mais apertado. */
    impossible: { cols: 35, rows: 35, time: 120 }
};

// Estado do Jogo
let state = {
    mode: 'menu', // menu, playing, win
    difficulty: 'easy',
    cols: 15,
    rows: 15,
    tileSize: 32, // tile é a unidade de medida do labirinto
    offsetX: 0,
    offsetY: 0,
    /** @type {number[][]} */
    map: [],
    /** Centro do jogador em coordenadas de tile (fracionárias); vx/vy em tiles/s.
     * facing: vista em idle/último movimento — 'up' sobe (−vy tile), 'down' desce (+vy), esq/dir. */
    player: { x: 1.5, y: 1.5, vx: 0, vy: 0, facing: /** @type {'up'|'down'|'left'|'right'} */ ('down') },
    start: { x: 1, y: 1 },
    end: { x: 13, y: 13 },
    timeLeft: 0,
    lastTime: 0,
    isMutating: false,
    mutationTimer: 0
};

// Teclas
/** @type {Record<string, boolean>} */
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false
};

// Event Listeners UI
btnStart?.addEventListener('click', startGame);
btnRestart?.addEventListener('click', startGame);
btnQuit?.addEventListener('click', showMenu);
selectDifficulty?.addEventListener('change', applyLocalizedLevelLabels);

applyLocalizedLevelLabels();

(function initDifficultyFromQuery() {
    try {
        const p = new URLSearchParams(window.location.search);
        const d = p.get('difficulty') || p.get('diff');
        if (d && selectDifficulty && Object.prototype.hasOwnProperty.call(CONFIG, d)) {
            selectDifficulty.value = d;
            applyLocalizedLevelLabels();
        }
    } catch (_) { /* ignore */ }
})();

// Controle de input (movimento contínuo no game loop)
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) && state.mode === 'playing') {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

function resizeCanvas() {
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    calculateTileSize();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    requestAnimationFrame(resizeCanvas);
});
document.addEventListener('fullscreenchange', () => {
    requestAnimationFrame(resizeCanvas);
});
if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        requestAnimationFrame(resizeCanvas);
    });
}

/** Altura reservada no topo quando o HUD está visível (medida real + margem). */
function getHudReservedHeight() {
    if (!hud || hud.classList.contains('hidden')) return 0;
    const h = hud.getBoundingClientRect().height;
    return Math.max(40, Math.ceil(h) + 8);
}

async function toggleGameFullscreen() {
    const box = document.getElementById('game-container');
    if (!box) return;
    try {
        if (!document.fullscreenElement) {
            await box.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (_) {
        /* API indisponível ou gesto bloqueado */
    }
}

btnFullscreen?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleGameFullscreen();
});

function startGame() {
    const diffKey = selectDifficulty?.value || 'easy';
    state.difficulty = Object.prototype.hasOwnProperty.call(CONFIG, diffKey) ? diffKey : 'easy';
    const conf = CONFIG[state.difficulty];
    state.cols = conf.cols;
    state.rows = conf.rows;
    state.timeLeft = conf.time; // tempo restante em segundos
    state.lastTime = performance.now(); // tempo da última atualização
    
    if (diffDisplay) diffDisplay.textContent = levelText(state.difficulty, 'hud');
    
    mainMenu?.classList.add('hidden');
    winScreen?.classList.add('hidden');  
    hud?.classList.remove('hidden');
    
    resizeCanvas();
    generateMaze();
    resetPlayer();
    
    state.mode = 'playing';
    requestAnimationFrame(gameLoop);
}

function showMenu() {
    state.mode = 'menu';
    hud?.classList.add('hidden');
    winScreen?.classList.add('hidden');
    mainMenu?.classList.remove('hidden');
}

/**
 * Margens só para enquadrar o labirinto (portões e shake).
 * @returns {{ marginX: number, marginTop: number, marginBottom: number }}
 */
function getMazeLayoutMargins() {
    const gateOut = (GATE_SPRITE_SCALE - 1) * 0.5 + 0.55;
    return {
        marginX: 2,
        marginTop: 2,
        marginBottom: 2 + gateOut + 1
    };
}

function calculateTileSize() {
    const hudHeight = getHudReservedHeight();
    const availW = canvas.width;
    const availH = Math.max(1, canvas.height - hudHeight);
    const { marginX, marginTop, marginBottom } = getMazeLayoutMargins();

    const worldW = state.cols + marginX * 2;
    const worldH = state.rows + marginTop + marginBottom;

    state.tileSize = Math.max(18, Math.floor(Math.min(availW / worldW, availH / worldH)));

    const ts = state.tileSize;
    const mazePxW = state.cols * ts;
    const mazePxH = state.rows * ts;
    const worldPxH = worldH * ts;

    state.offsetX = Math.floor((canvas.width - mazePxW) / 2);
    state.offsetY =
        hudHeight +
        Math.floor((availH - worldPxH) / 2) +
        marginTop * ts;
}

/**
 * Fisher–Yates in-place.
 * @template T
 * @param {T[]} arr
 */
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
    }
    return arr;
}

/**
 * Labirinto perfeito via Kruskal aleatorizado: muitas bifurcações e becos “convidativos”,
 * mas graficamente é uma árvore → um único caminho da entrada à saída (demais escolhas levam a becos).
 */
function generateMaze() {
    state.map = Array(state.rows).fill(0).map(() => Array(state.cols).fill(1));

    const strideX = Math.floor((state.cols - 1) / 2); // largura do labirinto em tiles
    const V = strideX * Math.floor((state.rows - 1) / 2); // número de células no labirinto

    const parent = new Uint32Array(V);
    for (let i = 0; i < V; i++) parent[i] = i;

    function find(i) {
        // encontrar o representante da célula i, 
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

    /**
     * @param {number} a
     * @param {number} b
     */
    function unionSet(a, b) {
        const ra = find(a);
        const rb = find(b);
        if (ra === rb) return false;
        parent[rb] = ra;
        return true;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    function cellId(x, y) {
        return ((y - 1) >> 1) * strideX + ((x - 1) >> 1);
    }

    /** @type {{x1:number,y1:number,x2:number,y2:number,wx:number,wy:number}[]} */
    const edges = [];
    for (let y = 1; y < state.rows - 1; y += 2) {
        for (let x = 1; x < state.cols - 1; x += 2) {
            if (x + 2 < state.cols - 1) {
                edges.push({ x1: x, y1: y, x2: x + 2, y2: y, wx: x + 1, wy: y });
            }
            if (y + 2 < state.rows - 1) {
                edges.push({ x1: x, y1: y, x2: x, y2: y + 2, wx: x, wy: y + 1 });
            }
        }
    }

    shuffleArray(edges);
    for (const e of edges) {
        const a = cellId(e.x1, e.y1);
        const b = cellId(e.x2, e.y2);
        if (!unionSet(a, b)) continue;
        state.map[e.y1][e.x1] = 0;
        state.map[e.y2][e.x2] = 0;
        state.map[e.wy][e.wx] = 0;
    }

    state.start = { x: 1, y: 0 };
    state.end = { x: state.cols - 2, y: state.rows - 1 };

    state.map[0][1] = 0;
    state.map[1][1] = 0;
    state.map[state.rows - 1][state.cols - 2] = 0;
    state.map[state.rows - 2][state.cols - 2] = 0;
}

/** Meia largura/altura do hitbox do jogador em unidades de tile (cabe em corredor 1 tile). */
const PLAYER_HALF_TILE = 0.28;
/** Velocidade escalar máxima (tiles/s). */
const PLAYER_MAX_SPEED = 5.75;
/** Quão rápido a velocidade alvo é perseguida com tecla pressionada (1/s). Mais alto = mais “cola” na direção. */
const PLAYER_STEER = 12;
/** Desaceleração exponencial sem input (1/s); menor = mais “manteiga” / deslize. */
const PLAYER_COAST = 2.4;

function resetPlayer() {
    state.player.x = state.start.x + 0.5;
    state.player.y = state.start.y + 0.5;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.facing = 'down';
}

/**
 * Direção normalizada do input (8 direções).
 * @returns {{ x: number, y: number }}
 */
function getPlayerInputDir() {
    let ix = 0;
    let iy = 0;
    if (keys.ArrowLeft || keys.a) ix -= 1;
    if (keys.ArrowRight || keys.d) ix += 1;
    if (keys.ArrowUp || keys.w) iy -= 1;
    if (keys.ArrowDown || keys.s) iy += 1;
    const len = Math.hypot(ix, iy);
    if (len < 1e-6) return { x: 0, y: 0 };
    return { x: ix / len, y: iy / len };
}

/**
 * @param {number} cx centro X em tiles
 * @param {number} cy centro Y em tiles
 */
function playerHitboxOverlapsWall(cx, cy) {
    const h = PLAYER_HALF_TILE;
    const minTx = Math.floor(cx - h);
    const maxTx = Math.floor(cx + h);
    const minTy = Math.floor(cy - h);
    const maxTy = Math.floor(cy + h);
    const pl = cx - h;
    const pr = cx + h;
    const pt = cy - h;
    const pb = cy + h;

    for (let ty = minTy; ty <= maxTy; ty++) {
        for (let tx = minTx; tx <= maxTx; tx++) {
            const wall = tx < 0 || tx >= state.cols || ty < 0 || ty >= state.rows || state.map[ty][tx] === 1;
            if (!wall) continue;
            const tileL = tx;
            const tileR = tx + 1;
            const tileT = ty;
            const tileB = ty + 1;
            if (pr > tileL && pl < tileR && pb > tileT && pt < tileB) return true;
        }
    }
    return false;
}

/**
 * @param {number} dt
 */
function updatePlayerPhysics(dt) {
    if (state.isMutating) return;

    const dir = getPlayerInputDir();
    const maxV = PLAYER_MAX_SPEED;
    let tx = state.player.vx;
    let ty = state.player.vy;

    if (dir.x !== 0 || dir.y !== 0) {
        const targetVx = dir.x * maxV;
        const targetVy = dir.y * maxV;
        const k = 1 - Math.exp(-PLAYER_STEER * dt);
        tx += (targetVx - tx) * k;
        ty += (targetVy - ty) * k;
    } else {
        const drag = Math.exp(-PLAYER_COAST * dt);
        tx *= drag;
        ty *= drag;
        if (Math.abs(tx) < 1e-4) tx = 0;
        if (Math.abs(ty) < 1e-4) ty = 0;
    }

    state.player.vx = tx;
    state.player.vy = ty;

    // Colisão separada por eixo (permite deslizar em cantos)
    const px = state.player.x + state.player.vx * dt;
    if (!playerHitboxOverlapsWall(px, state.player.y)) {
        state.player.x = px;
    } else {
        state.player.vx = 0;
    }

    const py = state.player.y + state.player.vy * dt;
    if (!playerHitboxOverlapsWall(state.player.x, py)) {
        state.player.y = py;
    } else {
        state.player.vy = 0;
    }

    const pvx = state.player.vx;
    const pvy = state.player.vy;
    const speed = Math.hypot(pvx, pvy);
    if (speed > 0.22) {
        if (Math.abs(pvx) >= Math.abs(pvy)) {
            state.player.facing = pvx > 0 ? 'right' : 'left';
        } else {
            state.player.facing = pvy > 0 ? 'down' : 'up';
        }
    }

    checkWin();
}

function checkWin() {
    const ex = state.end.x + 0.5;
    const ey = state.end.y + 0.5;
    const dx = state.player.x - ex;
    const dy = state.player.y - ey;
    if (dx * dx + dy * dy < 0.36) {
        state.mode = 'win';
        hud?.classList.add('hidden');
        winScreen?.classList.remove('hidden');
    }
}

// Atualização de Lógica
/**
 * @param {number} dt
 */
function update(dt) {
    if (state.mode !== 'playing') return;
    
    if (state.isMutating) {
        state.mutationTimer += dt;
        if (state.mutationTimer >= 1.5) {
            state.isMutating = false;
            state.timeLeft = CONFIG[state.difficulty].time;
        }
        return; // Pausa o cronômetro e a lógica durante a animação
    }
    
    // Atualiza o Timer de Mutação
    state.timeLeft -= dt;
    
    if (state.timeLeft <= 0) {
        // Inicia a transição dramática
        generateMaze();
        resetPlayer();
        state.isMutating = true;
        state.mutationTimer = 0;
        return;
    }

    updatePlayerPhysics(dt);
    
    // Formata o tempo para MM:SS
    let m = Math.floor(state.timeLeft / 60);
    let s = Math.floor(state.timeLeft % 60);
    if (timerDisplay) timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Grama de fundo em todo o canvas.
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {number} ts
 */
function drawGrassLayer(targetCtx, ts) {
    const cw = targetCtx.canvas.width;
    const ch = targetCtx.canvas.height;
    if (imgGrama.complete) {
        for (let bgY = -ts; bgY < ch + ts; bgY += ts) {
            for (let bgX = -ts; bgX < cw + ts; bgX += ts) {
                targetCtx.drawImage(imgGrama, bgX, bgY, ts, ts);
            }
        }
    } else {
        targetCtx.fillStyle = '#73a852';
        targetCtx.fillRect(-ts, -ts, cw + ts * 2, ch + ts * 2);
    }
}

/**
 * Labirinto, início, fim e jogador.
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {number} ts
 * @param {number} ox
 * @param {number} oy
 * @param {number} wallDropOffset
 */
function drawGameplayLayer(targetCtx, ts, ox, oy, wallDropOffset) {
    for (let y = 0; y < state.rows; y++) {
        for (let x = 0; x < state.cols; x++) {
            if (state.map[y][x] === 1) {
                if (imgMuro.complete) {
                    targetCtx.drawImage(imgMuro, ox + x * ts, oy + y * ts + wallDropOffset, ts, ts);
                } else {
                    targetCtx.fillStyle = '#4a5462';
                    targetCtx.fillRect(ox + x * ts, oy + y * ts + wallDropOffset, ts, ts);
                }
            } else {
                if (imgGrama.complete) {
                    targetCtx.drawImage(imgGrama, ox + x * ts, oy + y * ts, ts, ts);
                } else {
                    targetCtx.fillStyle = '#73a852';
                    targetCtx.fillRect(ox + x * ts, oy + y * ts, ts, ts);
                }
            }
        }
    }

    drawGateSprite(targetCtx, imgStart, state.start.x, state.start.y, ts, ox, oy, '#8b5a2b', 'ST');
    drawGateSprite(targetCtx, imgEnd, state.end.x, state.end.y, ts, ox, oy, '#e74c3c', 'FN');

    drawPlayerSprite(targetCtx, ts, ox, oy);
}

/**
 * Portão de entrada/saída centrado no tile (só visual; colisão não muda).
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {HTMLImageElement} img
 * @param {number} tileX
 * @param {number} tileY
 * @param {number} ts
 * @param {number} ox
 * @param {number} oy
 * @param {string} fallbackFill
 * @param {string} fallbackLabel
 */
function drawGateSprite(targetCtx, img, tileX, tileY, ts, ox, oy, fallbackFill, fallbackLabel) {
    const cx = ox + (tileX + 0.5) * ts;
    const cy = oy + (tileY + 0.5) * ts;
    const size = ts * GATE_SPRITE_SCALE;
    const x = cx - size / 2;
    const y = cy - size / 2;

    targetCtx.save();
    targetCtx.imageSmoothingEnabled = false;
    if (img.complete && img.naturalWidth > 0) {
        targetCtx.drawImage(img, x, y, size, size);
    } else {
        targetCtx.fillStyle = fallbackFill;
        targetCtx.fillRect(x, y, size, size);
        targetCtx.fillStyle = '#fff';
        targetCtx.font = `${Math.max(8, size / 4)}px "Press Start 2P"`;
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText(fallbackLabel, cx, cy);
    }
    targetCtx.restore();
}

/**
 * @param {CanvasRenderingContext2D} targetCtx
 * @param {number} ts
 * @param {number} ox
 * @param {number} oy
 */
function drawPlayerSprite(targetCtx, ts, ox, oy) {
    const w = ts * PLAYER_SPRITE_SCALE;
    const h = ts * PLAYER_SPRITE_SCALE;
    const pcx = ox + state.player.x * ts;
    const pcy = oy + state.player.y * ts;

    const facing = state.player.facing;
    const pair = PLAYER_WALK[facing] || PLAYER_WALK.down;
    const moving = Math.hypot(state.player.vx, state.player.vy) > 0.12;
    const frame = moving ? (Math.floor(performance.now() / PLAYER_WALK_FRAME_MS) % 2) : 0;
    const img = pair[frame];

    if (img.complete && img.naturalWidth > 0) {
        targetCtx.save();
        targetCtx.imageSmoothingEnabled = false;
        targetCtx.drawImage(img, pcx - w / 2, pcy - h / 2, w, h);
        targetCtx.restore();
        return;
    }

    targetCtx.fillStyle = '#3498db';
    targetCtx.fillRect(pcx - w / 2, pcy - h / 2, w, h);
    targetCtx.fillStyle = '#fff';
    const eye = ts * 0.12;
    const eyeY = pcy - h * 0.12;
    targetCtx.fillRect(pcx - w * 0.22 - eye / 2, eyeY, eye, eye);
    targetCtx.fillRect(pcx + w * 0.22 - eye / 2, eyeY, eye, eye);
}

/**
 * Modo impossível: fora dos círculos tudo preto; dentro, mapa com cores normais (via buffer + clip).
 * @param {number} ts
 * @param {number} ox
 * @param {number} oy
 * @param {number} shakeX
 * @param {number} shakeY
 * @param {number} wallDropOffset
 */
function drawImpossibleDarkWithLights(ts, ox, oy, shakeX, shakeY, wallDropOffset) {
    const w = canvas.width;
    const h = canvas.height;
    const buf = ensureVisionBuffer(w, h);
    const bctx = buf.getContext('2d');
    if (!bctx) {
        ctx.fillStyle = '#010104';
        ctx.fillRect(0, 0, w, h);
        return;
    }

    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, w, h);
    bctx.save();
    bctx.translate(shakeX, shakeY);
    drawGrassLayer(bctx, ts);
    drawGameplayLayer(bctx, ts, ox, oy, wallDropOffset);
    bctx.restore();

    ctx.fillStyle = '#010104';
    ctx.fillRect(0, 0, w, h);

    const px = ox + state.player.x * ts;
    const py = oy + state.player.y * ts;
    const sx = ox + (state.start.x + 0.5) * ts;
    const sy = oy + (state.start.y + 0.5) * ts;
    const ex = ox + (state.end.x + 0.5) * ts;
    const ey = oy + (state.end.y + 0.5) * ts;

    const rVision = Math.max(ts * 3.15, Math.min(w, h) * 0.095);
    const rMark = Math.max(ts * GATE_VISION_MARK_SCALE, 48);

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, rVision, 0, Math.PI * 2);
    // Sem moveTo, o Canvas liga o fim do arco anterior ao início do próximo com uma reta (faixa diagonal).
    ctx.moveTo(sx + rMark, sy);
    ctx.arc(sx, sy, rMark, 0, Math.PI * 2);
    ctx.moveTo(ex + rMark, ey);
    ctx.arc(ex, ey, rMark, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
}

// Renderização (Estilo Pixel Art)
function draw() {
    const ts = state.tileSize;
    const ox = state.offsetX;
    const oy = state.offsetY;
    const w = canvas.width;
    const h = canvas.height;

    let shakeX = 0;
    let shakeY = 0;
    let wallDropOffset = 0;

    if (state.mode === 'playing' && state.isMutating) {
        let progress = state.mutationTimer / 1.5;
        if (progress > 1) progress = 1;

        const shakeIntensity = (1 - progress) * 15;
        shakeX = (Math.random() - 0.5) * shakeIntensity * 2;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 2;

        const easeProgress = 1 - Math.pow(1 - progress, 3);
        wallDropOffset = (1 - easeProgress) * -h;
    }

    const useImpossibleVision =
        state.mode === 'playing' && state.difficulty === 'impossible' && !state.isMutating;

    ctx.clearRect(0, 0, w, h);

    if (useImpossibleVision) {
        drawImpossibleDarkWithLights(ts, ox, oy, shakeX, shakeY, wallDropOffset);
    } else {
        ctx.save();
        ctx.translate(shakeX, shakeY);
        drawGrassLayer(ctx, ts);
        if (state.mode !== 'playing') {
            ctx.restore();
            return;
        }
        drawGameplayLayer(ctx, ts, ox, oy, wallDropOffset);
        ctx.restore();
    }

    if (state.mode === 'playing' && !state.isMutating && state.timeLeft > 0 && state.timeLeft <= 5) {
        drawFinalCountdownOverlay();
    }
}

/** Últimos 5s: número enorme no centro + vinheta dramática. */
function drawFinalCountdownOverlay() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const digit = Math.ceil(state.timeLeft);
    const localT = Math.ceil(state.timeLeft) - state.timeLeft;
    const pop = 1 + 0.22 * Math.pow(Math.max(0, 1 - localT * 2.8), 2.2);
    const t = performance.now() * 0.004;
    const tension = 1 - localT;
    const jx = Math.sin(t * 1.7) * (3 + tension * 5);
    const jy = Math.cos(t * 1.3) * (2 + tension * 4);

    ctx.save();

    ctx.fillStyle = 'rgba(120, 0, 0, 0.18)';
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.12, cx, cy, Math.max(w, h) * 0.58);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const baseSize = Math.min(w, h) * 0.34;
    const str = String(digit);

    ctx.translate(cx + jx, cy + jy);
    ctx.scale(pop, pop);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${baseSize}px "Press Start 2P", monospace`;

    const glow = 18 + digit * 4;
    ctx.shadowColor = 'rgba(255, 60, 40, 0.85)';
    ctx.shadowBlur = glow;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillText(str, 10, 10);
    ctx.shadowBlur = glow * 0.6;

    const textGrad = ctx.createLinearGradient(-baseSize * 0.45, -baseSize * 0.5, baseSize * 0.45, baseSize * 0.5);
    textGrad.addColorStop(0, '#fff8e7');
    textGrad.addColorStop(0.45, '#ffb347');
    textGrad.addColorStop(1, '#e74c3c');

    ctx.strokeStyle = '#2c0a0a';
    ctx.lineWidth = Math.max(6, baseSize * 0.06);
    ctx.lineJoin = 'round';
    ctx.strokeText(str, 0, 0);

    ctx.fillStyle = textGrad;
    ctx.fillText(str, 0, 0);

    ctx.shadowBlur = 0;
    ctx.font = `${Math.max(12, baseSize * 0.09)}px "Press Start 2P", monospace`;
    ctx.fillStyle = 'rgba(255, 230, 200, 0.9)';
    ctx.fillText('MUDANÇA!', 0, baseSize * 0.72);

    ctx.restore();
}

/**
 * @param {number} timestamp
 */
function gameLoop(timestamp) {
    let dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    
    update(dt);
    draw();
    
    if (state.mode === 'playing') {
        requestAnimationFrame(gameLoop);
    }
}

// Config inicial da tela
resizeCanvas();
