import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

/** Full reload when context/hook modules change — Fast Refresh cannot handle them. */
function forceReloadOnContextChange(): Plugin {
  return {
    name: 'force-reload-context',
    handleHotUpdate({ file, server }) {
      if (/[\\/]context[\\/]|[\\/]hooks[\\/]useVigsy/.test(file)) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },
  };
}

/** Reload renderer when workspace package dist outputs change. */
function watchWorkspacePackages(): Plugin {
  const packagesRoot = path.resolve(__dirname, '../../packages');
  return {
    name: 'watch-workspace-packages',
    configureServer(server) {
      server.watcher.add(path.join(packagesRoot, '*/dist'));
      server.watcher.on('change', (file) => {
        if (file.includes(`${path.sep}packages${path.sep}`) && file.includes(`${path.sep}dist${path.sep}`)) {
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    forceReloadOnContextChange(),
    watchWorkspacePackages(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                entryFileNames: 'preload.js',
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    hmr: true,
  },
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
