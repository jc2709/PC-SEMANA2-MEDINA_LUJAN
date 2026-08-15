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
    title: "Almacén Nexo | Inventario bajo control",
    description: "Sistema de almacén para controlar inventario, alertas de stock, entradas, salidas y proveedores.",
    openGraph: {
      title: "Almacén Nexo",
      description: "Inventario bajo control: existencias, movimientos y alertas en un solo lugar.",
      type: "website",
      locale: "es_PE",
      url: origin,
      images: [{ url: image, width: 1200, height: 630, alt: "Panel de control de Almacén Nexo" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Almacén Nexo",
      description: "Inventario bajo control: existencias, movimientos y alertas en un solo lugar.",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
