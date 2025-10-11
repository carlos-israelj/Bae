import { head } from "./head.ts";
import { Header } from "@components/header/Header";

export const metadata = head;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="./output.css" />
        <link rel="icon" href="./favicon.ico" />
      </head>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
