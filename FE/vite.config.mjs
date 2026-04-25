import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Memuat environment variables sesuai mode (development, production, dsb)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: '0.0.0.0',
      /*https: {
        key: fs.readFileSync('./cert/192.168.5.142+1-key.pem'),
        cert: fs.readFileSync('./cert/192.168.5.142+1.pem'),
      },*/
      port: parseInt(env.VITE_PORT) || 5001, // default ke 5001 jika tidak ada .env
    },
  }
})
