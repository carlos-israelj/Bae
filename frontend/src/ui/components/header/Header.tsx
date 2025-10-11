"use client";

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
    <header className="w-full shadow-md">
      {/* 🔹 Barra superior (Contacto + Redes) */}
      <div className="bg-[#9FC0AF] text-white py-2 px-6 flex flex-col sm:flex-row items-center justify-between text-sm">
        <div className="flex items-center gap-4 mb-2 sm:mb-0">
          <div className="flex items-center gap-2">
            <PhoneIcon />
            <span>(+57) 310 000 0000</span>
          </div>
          <div className="flex items-center gap-2">
            <LocationIcon />
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

        <div className="flex items-center gap-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TwitterIcon />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <YoutubeIcon />
          </a>
        </div>
      </div>

      {/* 🔸 Barra inferior (Navbar principal) */}
      <nav className="bg-black text-white py-4 px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo / Nombre */}
          <Link href="/" className="text-xl font-bold tracking-wide">
            BAE<span className="text-[#9FC0AF]">Shop</span>
          </Link>

          {/* Menú hamburguesa (móvil) */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "✕" : "☰"}
          </button>

          {/* Links del menú (desktop) */}
          <ul className="hidden md:flex items-center gap-6 font-semibold">
            {["Home", "About us", "Shop", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  href={
                    item === "Home"
                      ? "/"
                      : `/${item.toLowerCase().replace(" ", "-")}`
                  }
                  className="hover:text-[#9FC0AF] transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
            <li>
              <button className="bg-[#9FC0AF] text-black px-4 py-2 rounded font-semibold hover:opacity-90 transition">
                Login Web3
              </button>
            </li>
            <li className="flex items-center gap-2">
              <CartIcon />
              <span>Cart</span>
            </li>
          </ul>
        </div>

        {/* Menú móvil */}
        {isOpen && (
          <div className="md:hidden mt-4 flex flex-col items-center gap-4">
            {["Home", "About us", "Shop", "Contact"].map((item) => (
              <Link
                key={item}
                href={
                  item === "Home"
                    ? "/"
                    : `/${item.toLowerCase().replace(" ", "-")}`
                }
                className="hover:text-[#9FC0AF] transition-colors"
              >
                {item}
              </Link>
            ))}
            <button className="bg-[#9FC0AF] text-black px-4 py-2 rounded font-semibold hover:opacity-90 transition">
              Login Web3
            </button>
            <div className="flex items-center gap-2">
              <CartIcon />
              <span>Cart</span>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
