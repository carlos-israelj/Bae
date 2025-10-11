import SectionContainer from "@layouts/section-container/SectionContainer";
import { Button } from "@components/button/Button";
import Image from "next/image";

export default function HeroSection() {
  return (
    <SectionContainer
      id="hero"
      className="relative flex items-center min-h-[calc(100vh-80px)] py-12 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
        {/* 🖼 Imagen principal */}
        <div className="relative flex justify-center lg:justify-end order-first lg:order-last">
          <div className="bg-surface rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl relative">
            <Image
              src="/images/hero-baby.jpg"
              alt="Smart Baby Monitor - BAE"
              width={800}
              height={600}
              priority
              className="w-full h-full object-cover rounded-2xl"
            />

            {/* Botones decorativos (izq / der) */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className="bg-primary/80 hover:bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200">
                ‹
              </button>
              <button className="bg-primary/80 hover:bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200">
                ›
              </button>
            </div>
          </div>

          {/* 🔤 Texto superpuesto sobre la imagen */}
          <h1 className="absolute top-1/3 left-6 sm:left-12 text-4xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-lg uppercase z-10">
            Your Dream <br />
            <span className="text-primary">Baby Shop</span>
          </h1>
        </div>

        {/* 🧸 Sección de texto (botón principal debajo del título) */}
        <div className="flex flex-col justify-center text-center lg:text-left px-4 lg:px-0">
          <p className="text-on-surface text-lg mb-6">
            Smart monitoring for your baby’s health and comfort — powered by IoT
            and blockchain.
          </p>
          <div className="flex justify-center lg:justify-start">
            <Button asChild>
              <a href="#">Order Now</a>
            </Button>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
