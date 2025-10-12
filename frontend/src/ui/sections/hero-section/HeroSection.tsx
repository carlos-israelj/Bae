import SectionContainer from "@layouts/section-container/SectionContainer";
import { Button } from "@components/button/Button";

export default function HeroSection() {
  return (
    <SectionContainer
      id="hero"
	className="relative flex items-start justify-start min-h-[75vh] bg-background overflow-hidden mt-12 md:mt-20"
    >
      {/* Imagen de fondo con borde curvado */}
      <div
        className="absolute inset-0 bg-cover bg-center rounded-[50px]"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/3932930/pexels-photo-3932930.jpeg')",
          backgroundColor: "#fff8ea",
          clipPath:
            "path('M0,0 H100% V88% Q90% 100%, 65% 92% T0,100% Z')", // curva inferior derecha
        }}
      />

      {/* Overlay translúcido */}
      <div className="absolute inset-0 bg-white/40 rounded-[50px]" />

      {/* Contenido principal */}
      <div className="relative z-10 max-w-2xl px-6 md:px-12 text-left">
        <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl uppercase mb-8 leading-tight drop-shadow-lg">
          Your Dream <br />
          Baby Shop
        </h1>
        <Button asChild>
          <a href="#">Order Now</a>
        </Button>
      </div>

      {/* Flechas decorativas */}
      <div className="absolute bottom-10 right-10 flex gap-3 z-10">
        <button className="bg-accent hover:bg-accent/90 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 text-xl font-bold">
          ‹
        </button>
        <button className="bg-primary hover:bg-primary/90 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 text-xl font-bold">
          ›
        </button>
      </div>
    </SectionContainer>
  );
}
