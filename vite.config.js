import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps in production for smaller builds
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          systems: [
            './src/systems/StorySystem.js',
            './src/systems/PowerSystem.js',
            './src/systems/InventorySystem.js',
            './src/systems/SaveSystem.js'
          ],
          managers: [
            './src/managers/GameManager.js',
            './src/managers/AssetManager.js',
            './src/managers/AudioManager.js'
          ],
          scenes: [
            './src/scenes/LoadingScene.js',
            './src/scenes/MainMenuScene.js',
            './src/scenes/GameWorldScene.js',
            './src/scenes/DialogueScene.js',
            './src/scenes/InventoryScene.js'
          ]
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/ogg|mp3|wav/i.test(ext)) {
            return `audio/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096 // Inline assets smaller than 4KB
  },
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  optimizeDeps: {
    include: ['phaser']
  }
});