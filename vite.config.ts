import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  if (isLib) {
    // Library build configuration
    return {
      plugins: [
        // Ensure automatic JSX runtime; avoid default React import in bundle
        react({ jsxRuntime: "automatic" }),
        svgr(),
        dts({
          insertTypesEntry: true,
          include: ["src/lib/**/*"],
          exclude: ["src/lib/**/*.test.*", "src/lib/**/*.stories.*"],
          tsconfigPath: "./tsconfig.lib.json",
        }),
      ],
      esbuild: {
        jsx: "automatic",
        jsxImportSource: "react",
      },
      build: {
        lib: {
          entry: resolve(__dirname, "src/lib/index.ts"),
          name: "PromptQLChatSDK",
          formats: ["es", "cjs"],
          fileName: "index",
        },
        rollupOptions: {
          // Keep React and the JSX runtime external to prevent bundling and interop issues
          external: ["react", "react-dom", "react/jsx-runtime"],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
            },
          },
        },
        cssCodeSplit: false,
        sourcemap: true,
        minify: "esbuild",
      },
    };
  }

  // Development configuration
  return {
    plugins: [react(), svgr()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (_proxyReq, req, _res) => {
              console.log("Sending Request to the Target:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  };
});
