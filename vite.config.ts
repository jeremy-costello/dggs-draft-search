import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { BASE_PATH } from './src/services/constants.ts';

// https://vite.dev/config/
export default defineConfig({
  base: `/${BASE_PATH}/`,
  plugins: [
    react()
  ],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  }
})
