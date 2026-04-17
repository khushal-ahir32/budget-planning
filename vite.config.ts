import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        short_name: "BudgetPro",
        name: "Budget Planning Application",
        description:
          "A tool that allocates income into savings, expenses, and investments",
        icons: [
          {
            src: "icons/icon-192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any maskable",
          },
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        orientation: "portrait-primary",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  base: '/budget-planning/',
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
