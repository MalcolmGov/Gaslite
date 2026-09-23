import { expect, type Page } from '@playwright/test';

export const SHOTS = process.env.SCREENSHOTS ? process.env.SCREENSHOTS : '';

export async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** Fresh session with instant simulation speed so tests don't wait on artificial delays. */
export async function freshStart(page: Page, mode: 'Guided' | 'Practice' | 'Facilitator' = 'Guided') {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/welcome');
  await page.getByRole('button', { name: new RegExp(`^.?\\s*${mode}`) }).first().click();
  await page.getByRole('button', { name: /Start the main journey/ }).click();
}

export async function setSpeed(page: Page, speed: 'Instant' | 'Fast') {
  await page.locator('#mode-select').selectOption('facilitator');
  await page.getByRole('button', { name: 'Facilitator' }).click();
  await page.getByRole('radio', { name: speed }).check();
  await page.getByRole('button', { name: 'Close' }).click();
}

export async function send(page: Page) {
  await page.getByRole('button', { name: 'Send', exact: true }).click();
}

/** Build, test, create and share the agent via the UI. */
export async function buildAgent(page: Page) {
  await page.locator('[data-tour="nav-new-agent"]').click();
  await page.getByRole('button', { name: /Use the exercise description/ }).click();
  await send(page);
  await page.getByRole('button', { name: 'The AI and Automation programme team' }).click();
  await page.getByRole('button', { name: 'Choose programme documents' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add knowledge' });
  await dialog.getByRole('tab', { name: 'AI & Automation Programme' }).click();
  for (const label of [/Select AI Programme Overview\.docx/, /Select Weekly Delivery Tracker\.xlsx, Week 38/, /Select Training Attendance Register/, /Select Programme Governance Guide/, /Select Steering Meeting Notes/]) {
    await dialog.getByRole('checkbox', { name: label }).check();
  }
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: "Say it's missing and suggest a next step" }).click();
  await expect(page.locator('#main-content').getByText('Your agent is set up.')).toBeVisible();
}
