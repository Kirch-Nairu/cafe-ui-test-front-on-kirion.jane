import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", {open:"never"}]],
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  projects: [
    {name:"1366x768", use:{...devices["Desktop Chrome"],viewport:{width:1366,height:768}}},
    {name:"1024x768", use:{...devices["Desktop Chrome"],viewport:{width:1024,height:768}}},
    {name:"390x844", use:{...devices["Desktop Chrome"],viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  },
  outputDir: "test-results"
});
