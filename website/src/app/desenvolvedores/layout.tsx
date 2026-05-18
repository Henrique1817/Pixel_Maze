import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Desenvolvedores | Pixel Maze",
  description:
    "Conheça a equipe por trás do Pixel Maze — engine procedural, interface e identidade visual.",
};

export default function DesenvolvedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
