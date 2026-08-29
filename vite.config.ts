import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.MY_AWS_ACCESS_KEY_ID': JSON.stringify(process.env.MY_AWS_ACCESS_KEY_ID || process.env.VITE_MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''),
      'import.meta.env.MY_AWS_SECRET_ACCESS_KEY': JSON.stringify(process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.VITE_MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''),
      'import.meta.env.MY_AWS_REGION': JSON.stringify(process.env.MY_AWS_REGION || process.env.VITE_MY_AWS_REGION || process.env.AWS_REGION || 'ap-south-1'),
      'import.meta.env.MY_AWS_S3_BUCKET_NAME': JSON.stringify(process.env.MY_AWS_S3_BUCKET_NAME || process.env.VITE_MY_AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || 'bhakti-ananda-photos'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    esbuild: {
      target: 'es2015',
    },
    build: {
      target: 'es2015',
      cssTarget: 'chrome61',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
