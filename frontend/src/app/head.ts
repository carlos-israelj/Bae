import type { Metadata } from "next";

export const head: Metadata = {
  title: "👶 BAE · Monitoreo Inteligente para Bebés",
  description:
    "BAE es una aplicación de monitoreo inteligente para bebés que combina IoT y blockchain para detectar cambios de temperatura, humedad o señales tempranas de riesgo en el entorno del bebé. Prevención, trazabilidad y bienestar en tiempo real.",
  keywords: [
    "BAE",
    "IoT",
    "bebés",
    "salud infantil",
    "prevención",
    "blockchain",
    "Polkadot",
    "Paseo testnet",
    "Web3",
    "monitoreo",
    "sensor",
    "bienestar",
    "cuidado infantil",
  ],
  authors: [{ name: "Equipo BAE" }],
  robots: "index, follow",
  openGraph: {
    title: "BAE · Monitoreo Inteligente para Bebés",
    description:
      "Sistema descentralizado que combina IoT y blockchain para monitorear y proteger la salud de los bebés. Detecta condiciones críticas y garantiza trazabilidad de datos en tiempo real.",
    url: "https://latinhack-bae.vercel.app",
    siteName: "BAE – Baby App Environment",
    images: [
      {
        url: "https://latinhack-bae.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "BAE App - Monitoreo IoT para bebés",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BAE · IoT y Blockchain para el cuidado de bebés",
    description:
      "Prevención temprana de riesgos en bebés mediante IoT y trazabilidad blockchain. Un proyecto desarrollado para LatinHack.",
    creator: "@latinhack_io",
    images: ["https://latinhack-bae.vercel.app/og-image.png"],
  },
};
