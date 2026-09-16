import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const image = `${origin}/og.png`;

  return {
    title: "Canvas Model IA | Modelo de negocio con evidencia",
    description: "Sistema local para organizar datos, periodos y decisiones de evolución del Business Model Canvas.",
    openGraph: {
      title: "Canvas Model IA",
      description: "Datos, contexto y decisiones para evolucionar el modelo de negocio.",
      type: "website",
      locale: "es_PE",
      url: origin,
      images: [{ url: image, width: 1200, height: 630, alt: "Panel de control de Canvas Model IA" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Canvas Model IA",
      description: "Datos, contexto y decisiones para evolucionar el modelo de negocio.",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
