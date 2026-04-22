import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MelodyMatch",
  description: "Encontrá canciones tarareando o marcando el ritmo."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
