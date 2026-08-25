/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Produção em Docker: gera .next/standalone (server.js + node_modules
  // podados por tracing), consumido pelo estágio `runner` do Dockerfile.
  output: "standalone",
  experimental: {
    serverActions: {
      // Default do Next é 1MB, insuficiente até para 1 currículo (limite de
      // 5MB em MAX_FILE_SIZE, src/actions/candidatos.ts). 80mb suporta um
      // lote de upload em massa de até 15 arquivos de 5MB, com margem.
      bodySizeLimit: "80mb",
    },
  },
};

export default config;
