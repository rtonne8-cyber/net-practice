import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/net-practice/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"],
      manifest: {
        name: "The Net — Practice",
        short_name: "The Net",
        description: "Garden-net golf practice challenge generator",
        theme_color: "#10130F",
        background_color: "#10130F",
        display: "standalone",
        orientation: "portrait",
        start_url: "/net-practice/",
        scope: "/net-practice/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: []
      }
    })
  ]
});
