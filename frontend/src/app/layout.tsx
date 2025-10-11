import "@rainbow-me/rainbowkit/styles.css";
import { head } from "./head";
import { Header } from "@components/header/Header";
import { Web3Provider } from "@lib/Web3Provider";

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
        <Web3Provider>
          <Header />
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
