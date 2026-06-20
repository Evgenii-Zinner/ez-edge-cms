import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

// Clean up any stale temp KV directories from previous runs
try {
  const rootFiles = fs.readdirSync(path.resolve("."));
  for (const file of rootFiles) {
    if (file.startsWith("temp-kv-state-")) {
      try {
        fs.rmSync(path.resolve(file), { recursive: true, force: true });
      } catch (e) {
        // Ignore if locked by another active process
      }
    }
  }
} catch (e) {
  // Ignore filesystem access errors
}

// Generate a unique directory name for this specific test run
const randomId = Math.random().toString(36).substring(2, 10);
const tempKvPath = path.resolve(`temp-kv-state-${randomId}`);

// Attempt cleanup on process exit
process.on("exit", () => {
  try {
    if (fs.existsSync(tempKvPath)) {
      fs.rmSync(tempKvPath, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore if cleanup fails on immediate exit
  }
});

const PORT = process.env.PORT || "8788";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `wrangler dev --local --persist-to ${tempKvPath} --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
