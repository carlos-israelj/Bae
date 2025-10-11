# Bae Frontend

Este repositorio contiene la capa frontend del proyecto **Bae**, con soporte para conexión a blockchain, visualización de datos y wallet integration moderno.

---

## 🧰 Stack principal

| Componente            | Versión / recomendación  |
| --------------------- | ------------------------ |
| Next.js               | 15.5.4                   |
| next-rspack           | compatible con Next 15   |
| Tailwind CSS          | v4 (4.x)                 |
| @tailwindcss/cli      | versión para v4          |
| viem                  | ^2.38.0                  |
| wagmi                 | ^2.14.16                 |
| @tanstack/react-query | ^5.37.1                  |
| RainbowKit            | v2.x (recomendado 2.2.8) |

---

## 🚀 Cómo arrancar (desarrollo)

1. Instala dependencias:

   ```bash
   bun install
   ```

2. Abre una segunda ventana de terminal y compila CSS con Tailwind en modo watch:

   ```bash
   bunx @tailwindcss/cli -i ./src/app/global.css -o ./public/output.css --watch
   ```

3. Inicia el servidor Next con Rspack:

   ```bash
   bun dev
   ```

4. Abre en el navegador: `http://localhost:3000`

---

## 🧠 Consideraciones finales

- Este proyecto **usa Bun** como entorno de ejecución, por lo que algunos comandos usan `bun` o `bunx`.
- **Rspack** reemplaza el bundler tradicional para lograr builds rápidos y eficientes.
