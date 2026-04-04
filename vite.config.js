import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Force l'erreur si le port est occupé
    host: true, // Permet l'accès depuis le réseau local (pour tester sur mobile)
  },
});
