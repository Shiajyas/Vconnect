import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    historyApiFallback: true,
  },
  define: {
    // Define environment variables that can be accessed in the frontend code
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'default_value'),
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL || 'default_value'),
  },
});
