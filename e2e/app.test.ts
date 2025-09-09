import { test, expect } from '@playwright/test';

test('Create Rechnung and PDF', async ({ page }) => {
  await page.goto('app://./index.html');
  // Simulate CRUD, check PDF output
});