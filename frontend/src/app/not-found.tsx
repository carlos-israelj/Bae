import Link from "next/link";
import { Button } from "@components/button/Button";

export default function NotFound() {
  return (
    <div className="container-responsive min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="max-w-lg mx-auto">
        <h1 className="text-heading text-primary mb-3">
          404 - Página no encontrada
        </h1>
        <p className="text-subheading text-main mb-10">
          Lo que buscas no está aquí o nunca existió
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/#contact">Contactar soporte</Link>
          </Button>
        </div>

        <div className="mt-12 opacity-70">
          <p className="text-xs mb-2 font-medium uppercase tracking-wide">
            ¿Eres desarrollador?
          </p>
          <div className="text-xs font-mono bg-surface border border-primary/20 rounded-lg p-3">
            Error: route not matched in manifest
          </div>
        </div>
      </div>
    </div>
  );
}
