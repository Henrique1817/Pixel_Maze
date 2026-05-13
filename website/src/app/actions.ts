"use server";
import fs from "fs";
import path from "path";
import { getLabirintoRoot } from "@/lib/getLabirintoRoot";

export async function getGameCode() {
  const filePath = path.join(getLabirintoRoot(), "game.js");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    return "// Erro ao carregar a lógica do jogo (game.js não encontrado)";
  }
}
