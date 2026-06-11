import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Second app — same monorepo, same .env (envDir), different port.
export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
