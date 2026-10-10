// Bedienungs-Tests: npm run test:e2e (startet dafür einen lokalen Server)
const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'tests',
  timeout:60000,
  fullyParallel:true,
  workers:process.env.CI?2:3,
  expect:{timeout:10000},
  retries:process.env.CI?1:0,
  reporter:process.env.CI?'list':'line',
  use:{baseURL:'http://localhost:8123',serviceWorkers:'block',...devices['iPad Mini']},
  projects:[{name:'chromium',use:{browserName:'chromium'}}],
  webServer:{command:'node scripts/serve.js 8123',url:'http://localhost:8123',reuseExistingServer:!process.env.CI}
});
