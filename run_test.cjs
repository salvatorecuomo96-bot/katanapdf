const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    console.log(`PAGE EXCEPTION: ${exception}`);
  });

  try {
    await page.goto('http://localhost:5173');
    
    // Wait for the app to load
    await page.waitForTimeout(2000);
    
    // Upload a file (can use an existing png like public/logo.png)
    const fileInput = await page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(__dirname, 'public', 'logo.png'));
    
    // Wait a bit to let the app process the file
    await page.waitForTimeout(3000);
    
  } catch (err) {
    console.error("Test failed", err);
  } finally {
    await browser.close();
  }
})();