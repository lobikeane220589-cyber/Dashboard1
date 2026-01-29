
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ВАЖНО: это название вашего репозитория на GitHub
  base: '/Dashboard1/', 
  build: {
    outDir: 'dist',
  }
});
