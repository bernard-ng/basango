import { readEnvFiles } from "@basango/domain/config/environment";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  applyPublicEnvironment(mode);

  return {
    envDir: false,
    plugins: [
      tanstackStart({
        router: {
          generatedRouteTree: "./routeTree.gen.ts",
          routesDirectory: "./routes",
        },
      }),
      nitro(),
      tailwindcss(),
      viteReact(),
    ],
    resolve: {
      alias: [
        {
          // React 19 provides this API natively. Avoid Nitro loading the CommonJS
          // shim through createRequire(), which would create a second SSR runtime.
          find: /^use-sync-external-store\/shim$/,
          replacement: "react",
        },
      ],
      tsconfigPaths: true,
    },
  };
});

function applyPublicEnvironment(mode: string): void {
  for (const [key, value] of Object.entries(readEnvFiles({ nodeEnvironment: mode }))) {
    if (key.startsWith("VITE_") && value !== undefined && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
