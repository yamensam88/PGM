import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => {
    errors.push('PageError: ' + err.toString());
  });
  page.on('error', err => {
    errors.push('Error: ' + err.toString());
  });
  page.on('console', msg => {
    if(msg.type() === 'error') {
       errors.push('ConsoleError: ' + msg.text());
    }
  });

  try {
    console.log("Navigating to login...");
    await page.goto('http://localhost:3000');
    
    // Check if we need to login
    if (page.url().includes('login')) {
      console.log("Logging in...");
      await page.type('input[name="email"]', 'sam.smith@transportos.com');
      await page.type('input[name="password"]', 'TransferOS2026!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 10000 }).catch(e => console.log("Nav timeout", e));
    }

    console.log("Navigating to /dispatch/runs...");
    await page.goto('http://localhost:3000/dispatch/runs', { timeout: 10000 }).catch(e => console.log("Goto timeout", e));
    await page.waitForSelector('button[role="tab"]', { timeout: 5000 }).catch(e => console.log("Selector timeout", e));
    
    console.log("Looking for Flotte tab...");
    // Find Flotte tab (value="vehicles" or text "Flotte de Véhicules")
    const flotteTab = await page.$('button[role="tab"]:has-text("Véhicules")') || await page.$('button[value="vehicles"]') || await page.$('button[role="tab"] >> text=Flotte');
    if (flotteTab) {
        await flotteTab.click();
        await new Promise(r => setTimeout(r, 1000));
    } else {
        console.log("Flotte tab not found!");
    }

    console.log("Clicking action menu '...'...");
    // Find the first SVG that looks like MoreHorizontal inside a button in the table
    const actionButton = await page.$('td button svg.lucide-more-horizontal');
    if (actionButton) {
        const btn = await actionButton.evaluateHandle(node => node.closest('button'));
        await btn.click();
        console.log("Clicked! Waiting 2s for errors...");
        await new Promise(r => setTimeout(r, 2000));
    } else {
        console.log("Action button not found!");
        console.log(await page.content());
    }

  } catch (err) {
    console.error("Test Script Error:", err);
  } finally {
    await browser.close();
    
    console.log("--- CAPTURED BROWSER ERRORS ---");
    if (errors.length === 0) console.log("None!");
    else errors.forEach(e => console.log(e));
  }
})();
