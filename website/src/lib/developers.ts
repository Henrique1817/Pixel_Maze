export type Developer = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  accent: string;
};

export const DEVELOPERS: Developer[] = [
  {
    id: "boni",
    name: "Boni",
    role: "Engine & Gameplay",
    bio: "Lógica do motor, geração procedural e mecânicas de jogo em tempo real.",
    image: "/boni.png",
    accent: "from-amber-500/25 to-transparent",
  },
  {
    id: "fernando",
    name: "Fernando",
    role: "Frontend & UI",
    bio: "API do jogo para o site.",
    image: "/fernando.png",
    accent: "from-cyan-500/20 to-transparent",
  },
  {
    id: "henrique",
    name: "Henrique",
    role: "Systems & Build",
    bio: "Interface, experiência web e integração do site com o build do jogo e infraestrutura do projeto.",
    image: "/henrique.png",
    accent: "from-emerald-500/25 to-transparent",
  },
  {
    id: "regio",
    name: "Regio",
    role: "Level Design",
    bio: "Curadoria de dificuldades, pacing dos níveis e balanceamento.",
    image: "/regio.png",
    accent: "from-violet-500/20 to-transparent",
  },
  {
    id: "thiago",
    name: "Thiago",
    role: "Visual & Polish",
    bio: "Pixel art, identidade visual e refinamento da estética retro.",
    image: "/thiago.png",
    accent: "from-rose-500/20 to-transparent",
  },
];
