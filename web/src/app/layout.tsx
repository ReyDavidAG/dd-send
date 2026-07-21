import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Poppins, Great_Vibes } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Tipografías para diferenciar plantillas.
const playfair = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-fun", subsets: ["latin"], weight: ["600", "800"] });
const greatVibes = Great_Vibes({ variable: "--font-script", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "DD-Send — invitaciones digitales personalizadas",
  description:
    "Crea invitaciones digitales únicas: elige una plantilla, personalízala con tus fotos y textos, y compártela con un enlace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${poppins.variable} ${greatVibes.variable} h-full antialiased`}
    >
      {/* Extensiones (p. ej. ColorZilla → cz-shortcut-listen) inyectan atributos
          en <body> antes de hidratar; suppressHydrationWarning silencia ese
          falso positivo sin afectar el resto del árbol. */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
