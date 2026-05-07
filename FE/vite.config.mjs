import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { fileURLToPath } from "url";
import path from "path";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      viteCommonjs(),           // ← PENTING untuk dicom-parser
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT) || 5001,

      proxy: {
        '/uploads': {
          target: 'http://192.168.5.142:3001',
          changeOrigin: true,
          secure: false,
        },
      },

      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    },

    optimizeDeps: {
      exclude: [
        '@cornerstonejs/dicom-image-loader',
        '@cornerstonejs/codec-libjpeg-turbo-8bit',
        '@cornerstonejs/codec-charls',
        // tambahkan codec lain kalau muncul error
      ],
      include: ['dicom-parser'],
    },

    worker: {
      format: 'es',           // ← Sangat penting
    },

    assetsInclude: ['**/*.wasm'],   // ← Untuk file WASM
  }
})