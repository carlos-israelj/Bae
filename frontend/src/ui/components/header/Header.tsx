"use client";

import { ConnectWallet } from "@wallet/ConnectWallet";
import { useState } from "react";
import Link from "next/link";
import {
  LocationIcon,
  PhoneIcon,
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
  CartIcon,
} from "@components/icons";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full shadow-none bg-background relative z-50">
      {/* 🔹 Barra superior (solo redes en mobile) */}
      <div className="bg-secondary text-white py-[6px] px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs">
        {/* 📞 Contacto + Ubicación (oculto en mobile) */}
        <div className="hidden sm:flex items-center gap-2 mb-1 sm:mb-0">
          <div className="flex items-center gap-1">
            <PhoneIcon className="w-3 h-3" />
            <span>(+57) 310 000 0000</span>
          </div>
          <div className="flex items-center gap-1">
            <LocationIcon className="w-3 h-3" />
            <a
              href="https://unsplash.com/s/photos/iot-device"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              IoT Devices Store
            </a>
          </div>
        </div>

        {/* 🌐 Redes Sociales */}
        <div className="flex items-center justify-center gap-2">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <FacebookIcon className="w-3 h-3" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <InstagramIcon className="w-3 h-3" />
          </a>
          <a href="https://x.com/BaeBabyapp" target="_blank" rel="noopener noreferrer">
            <TwitterIcon className="w-3 h-3" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <YoutubeIcon className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 🔸 Navbar inferior */}
      <nav className="relative bg-background text-main py-3 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* 🔑 Login (solo móvil, izquierda) */}
          <div className="md:hidden">
            <ConnectWallet />
          </div>

          {/* Links (desktop, izquierda) */}
          <ul className="hidden md:flex items-center gap-8 font-bold text-[15px] tracking-wide">
            {["Home", "About us", "Shop", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  href={
                    item === "Home"
                      ? "/"
                      : `/${item.toLowerCase().replace(" ", "-")}`
                  }
                  className="pb-1 border-b-[2px] border-transparent border-dotted hover:border-[#FF9689] transition-all duration-200"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>

          {/* 🧸 Logo centrado */}
          <div className="absolute left-1/2 transform -translate-x-1/2 translate-y-10 md:translate-y-6 z-10 flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="BAE Logo"
              className="w-16 h-16 md:w-28 md:h-28 select-none"
            />
          </div>

          {/* 🔒 Login + Cart (desktop derecha) */}
          <div className="hidden md:flex items-center gap-4">
            <ConnectWallet />
            <div className="flex items-center gap-1">
              <CartIcon className="w-5 h-5" />
              <span>Cart</span>
            </div>
          </div>

          {/* ☰ Menú móvil */}
          <button
            className={`md:hidden text-main text-2xl z-[99999] relative transition-transform duration-300 ease-in-out ${
              isOpen ? "rotate-90 scale-110" : "rotate-0 scale-100"
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* 📱 Modal móvil (con animación suave) */}
        <div
          className={`fixed inset-0 z-[9999] bg-[#FFF8EA] flex flex-col items-center justify-center gap-5 text-lg font-semibold text-[#4B4B4B] transition-all duration-500 ease-in-out ${
            isOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-5 pointer-events-none"
          }`}
        >
          {["Home", "About us", "Shop", "Contact"].map((item) => (
            <Link
              key={item}
              href={
                item === "Home"
                  ? "/"
                  : `/${item.toLowerCase().replace(" ", "-")}`
              }
              className="hover:text-primary border-b-[2px] border-transparent border-dotted hover:border-[#FF9689] pb-1 transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </Link>
          ))}

          {/* 🛒 Carrito */}
          <div className="flex items-center gap-2">
            <CartIcon className="w-5 h-5" />
            <span>Cart</span>
          </div>

          {/* 📞 Teléfono e IoT en mobile */}
          <div className="flex flex-col items-center gap-2 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <PhoneIcon className="w-4 h-4" />
              <span>(+57) 310 000 0000</span>
            </div>
            <div className="flex items-center gap-1">
              <LocationIcon className="w-4 h-4" />
              <a
                href="https://unsplash.com/s/photos/iot-device"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                IoT Devices Store
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
