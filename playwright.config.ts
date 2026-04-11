import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
  },
  webServer: {
    command: "node server.mjs",
    port: 4173,
    reuseExistingServer: true,
  },
});
