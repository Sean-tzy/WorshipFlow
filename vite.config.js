var _a, _b;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        port: Number((_a = process.env.VITE_PORT) !== null && _a !== void 0 ? _a : 5173),
        proxy: {
            "/api": {
                target: (_b = process.env.VITE_API_PROXY_TARGET) !== null && _b !== void 0 ? _b : "http://127.0.0.1:8000",
                changeOrigin: true,
            },
        },
    },
});
