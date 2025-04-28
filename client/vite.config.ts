import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    
  },
  define: {
    // Define environment variables that can be accessed in the frontend code
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'default_value'),
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL || 'default_value'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
});
