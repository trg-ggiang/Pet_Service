import { defineConfig, devices } from "@playwright/test";

const frontendUrl = process.env.E2E_FRONTEND_URL || "http://localhost:5173";
const backendUrl = process.env.E2E_BACKEND_URL || "http://localhost:5050";
const useManagedServers = !process.env.E2E_FRONTEND_URL && !process.env.E2E_BACKEND_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useManagedServers
    ? [
        {
          command: "npm run dev:backend",
          url: `${backendUrl}/api/health`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "npm --prefix frontend run dev",
          url: frontendUrl,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ]
    : undefined,
});
