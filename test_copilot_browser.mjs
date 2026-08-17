import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard/1');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Find the copilot input field
  const inputSelector = 'textarea, input[placeholder*="Quais"], input[type="text"]';
  const input = await page.$(inputSelector);
  
  if (input) {
    console.log('Found Copilot input field');
    
    // Type a question
    await input.fill('Quais tabelas contêm dados sensíveis?');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(10000);
    
    // Get all text content to check for error
    const pageText = await page.content();
    
    if (pageText.includes('Cannot read properties')) {
      console.log('ERROR: .map() error still present!');
    } else if (pageText.includes('sensíveis')) {
      console.log('SUCCESS: Response received without error');
    } else {
      console.log('Response received, checking content...');
    }
    
    console.log('Page loaded successfully');
  } else {
    console.log('Could not find Copilot input');
  }
  
  await browser.close();
})().catch(console.error);
