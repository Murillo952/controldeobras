import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Convierte la app en un PWA instalable y cachea el "shell" (HTML/JS/CSS)
    // para que abra sin conexión a internet. Los datos siguen viniendo de
    // Supabase (ver src/lib/offlineCache.js para el respaldo de datos offline).
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Control de Obras",
        short_name: "Control de Obras",
        description: "Programación y control financiero de obras",
        start_url: "/",
        display: "standalone",
        background_color: "#F6F5F2",
        theme_color: "#1B2A3C",
        icons: [],
      },
      workbox: {
        // Precachea todo lo que genera el build (JS/CSS/HTML) para que la
        // app cargue offline. Las llamadas a Supabase (API/Auth) nunca se
        // cachean: siguen necesitando conexión, como es lógico.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
