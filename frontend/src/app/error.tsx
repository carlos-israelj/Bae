"use client";

import Link from "next/link";
import { Button } from "@components/button/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-responsive min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="max-w-lg mx-auto">
        <h1 className="text-heading text-primary mb-4">¡Ups! Algo salió mal</h1>

        <div className="bg-surface rounded-xl p-6 mb-8 border border-primary/10 shadow-sm">
          <p className="text-subheading mb-4">
            {error.message || "Ocurrió un error inesperado"}
          </p>

          {error.digest && (
            <p className="text-sm text-main/60 mb-4">
              Error ID: <span className="font-mono">{error.digest}</span>
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={reset}>Reintentar</Button>
            <Button asChild variant="secondary">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>

        <div className="text-sm text-main/70">
          <p>¿Sigue ocurriendo el error?</p>
          <p className="mt-2">
            Contáctanos en{" "}
            <a
              href="mailto:soporte@baestore.co"
              className="text-primary hover:underline"
            >
              soporte@baestore.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
