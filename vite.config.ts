import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://sx7pwm8x-8080.asse.devtunnels.ms", 
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "True",
          Accept: "application/json",
        },
      },
    },
  },
});
