# 🌡️ BAE Frontend

Este repositorio contiene la capa **frontend** del proyecto **BAE** (Baby Ambient Environment),  
una aplicación IoT + Web3 que permite visualizar datos de sensores y conectarse con la blockchain de **Paseo Testnet**.

---

## 🧰 Stack principal

| Componente                | Versión / recomendación  |
| ------------------------- | ------------------------ |
| **Next.js**               | 15.5.4                   |
| **next-rspack**           | Compatible con Next 15   |
| **Tailwind CSS**          | v4 (4.x)                 |
| **@tailwindcss/cli**      | versión para v4          |
| **viem**                  | ^2.38.0                  |
| **wagmi**                 | ^2.14.16                 |
| **@tanstack/react-query** | ^5.37.1                  |
| **RainbowKit**            | v2.x (recomendado 2.2.8) |
| **chart.js**              | ^4                       |
| **react-chartjs-2**       | ^5                       |

---

## ⚙️ Variables de entorno

Crea un archivo **`.env.local`** en la raíz del proyecto con los siguientes valores:

```env
# RPC del nodo EVM compatible
NEXT_PUBLIC_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io

# Dirección del contrato desplegado en Paseo testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217

# Configuración de red
NEXT_PUBLIC_CHAIN_ID=3338
NEXT_PUBLIC_NETWORK_NAME="Paseo Testnet"

# API del backend (indexador)
NEXT_PUBLIC_API_URL=https://bae-backend-api.onrender.com

# Project ID de WalletConnect / Reown (RainbowKit)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=7aed94227516ddc02fa31b0862a946b2
```

> 💡 Estas variables se usan para:
>
> - `wagmi` y `viem`: conexión RPC (blockchain Paseo)
> - `RainbowKit`: login Web3 en navegador
> - `fetch`: obtener datos IoT desde el backend

---

## 🚀 Cómo arrancar en desarrollo

1. Instala dependencias:

   ```bash
   bun install
   ```

2. Abre una segunda ventana de terminal y ejecuta el build de Tailwind (modo watch):

   ```bash
   bun run build:styles
   ```

3. Inicia el servidor de desarrollo con **Next + Rspack**:

   ```bash
   bun dev
   ```

4. Abre en tu navegador:

   ```
   http://localhost:3000
   ```

---

## 🧱 Estructura del proyecto

```bash
src/
├── app/
│   ├── layout.tsx           # Root layout (Web3Provider + Header)
│   ├── page.tsx             # Landing page
│   └── test/page.tsx        # Dashboard (gráficas + blockchain)
├── lib/
│   ├── Web3Provider.tsx     # Wagmi + RainbowKit + React Query context
│   ├── wagmi.ts             # Configuración de red (Paseo Testnet)
│   └── abi/                 # ABI del contrato IoT
├── ui/
│   ├── components/          # Header, botones, íconos
│   ├── layouts/             # SectionContainer (wrapper de secciones)
│   ├── sections/
│   │   ├── hero-section/    # Sección principal (landing)
│   │   └── dashboard/       # Dashboard completo (charts, panels, etc.)
│   └── wallet/              # ConnectWallet (RainbowKit Custom)
```

---

## 🌐 Flujo de datos

| Capa                         | Fuente de datos                                  | Tecnología usada                 |
| ---------------------------- | ------------------------------------------------ | -------------------------------- |
| **Login Web3 (Wallet)**      | Navegador (Brave / MetaMask)                     | RainbowKit + Wagmi               |
| **Blockchain (último hash)** | RPC Paseo (`NEXT_PUBLIC_RPC_URL`)                | viem (`createPublicClient`)      |
| **Lecturas IoT**             | API Backend (`NEXT_PUBLIC_API_URL/api/readings`) | Fetch API + React Query          |
| **Gráficas**                 | Datos del backend                                | Chart.js + react-chartjs-2       |
| **UI / Diseño**              | Layouts y Tailwind v4                            | Next.js App Router + TailwindCSS |

---

## 🧠 Consideraciones finales

- Este proyecto **usa Bun** como runtime, por lo tanto todos los comandos de npm/yarn deben reemplazarse por `bun` o `bunx`.
- **Rspack** reemplaza Webpack para obtener builds más rápidos y un entorno de desarrollo optimizado.
- **Next.js 15 + Tailwind 4** garantizan compatibilidad moderna y soporte para SSR + Streaming + App Router.

## 👥 Créditos

Desarrollado con ❤️ por el equipo **BAE**
Integración IoT + Blockchain para un entorno más confiable y transparente.
