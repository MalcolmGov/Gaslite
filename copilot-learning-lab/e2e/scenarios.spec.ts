import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { shot } from './helpers';

/** Start in Facilitator mode and load a lesson's known starting state. */
async function loadLesson(page: Page, lesson: string, speed: 'Instant' | 'Fast' = 'Instant') {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/welcome');
  await page.getByRole('button', { name: /Facilitator/ }).first().click();
  await page.getByRole('button', { name: /Start the main journey/ }).click();
  await page.getByRole('button', { name: 'Facilitator', exact: true }).click();
  await page.getByRole('radio', { name: speed }).check();
  await page.locator('.lesson-row', { hasText: lesson }).getByRole('button', { name: 'Load' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
}

const emailCard = (page: Page) => page.getByRole('group', { name: 'Email approval' });
const meetingCard = (page: Page) => page.getByRole('group', { name: 'Meeting approval' });

test('a rejected action never executes', async ({ page }) => {
  await loadLesson(page, 'Review and approve');
  await expect(emailCard(page)).toBeVisible();
  await emailCard(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(emailCard(page).getByText('Cancelled — not sent')).toBeVisible();
  await meetingCard(page).getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.task-head')).toContainText('Completed');
  await page.locator('[data-tour="nav-mail"]').click();
  await expect(page.getByText(/No sent items yet\. 1 email\(s\) were cancelled/)).toBeVisible();
  await page.getByRole('tab', { name: /Calendar/ }).click();
  await expect(page.getByText('Follow-up: unresolved AI programme risks')).toHaveCount(0);
});

test('undo during the send window and edit-after-approval require fresh approval', async ({ page }) => {
  await loadLesson(page, 'Review and approve', 'Fast');
  const card = emailCard(page);
  await card.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(card.getByText(/Sending in \d+s/)).toBeVisible();
  await card.getByRole('button', { name: 'Edit' }).click();
  await card.getByLabel('Subject').fill('AI programme weekly update — revised');
  await card.getByRole('button', { name: 'Save changes' }).click();
  await expect(card.getByText('Changed after approval — approve again')).toBeVisible();
  await expect(card.getByText('Needs approval')).toBeVisible();
  await page.waitForTimeout(3000);
  await page.locator('[data-tour="nav-mail"]').click();
  await expect(page.getByText(/No sent items yet/)).toBeVisible();
});

test('refresh recovery: nothing is repeated or sent twice', async ({ page }) => {
  await loadLesson(page, 'Review and approve', 'Fast');
  // Fail once, retry to send.
  await emailCard(page).getByRole('button', { name: 'Send', exact: true }).click();
  await expect(emailCard(page).getByText(/connector timed out/)).toBeVisible();
  await emailCard(page).getByRole('button', { name: 'Retry' }).click();
  await expect(emailCard(page).getByText('Sent (simulated)', { exact: true })).toBeVisible();
  // Approve the meeting, then refresh inside the undo window.
  await meetingCard(page).getByRole('button', { name: /Use first free time/ }).click();
  await meetingCard(page).getByRole('button', { name: 'Create', exact: true }).click();
  await expect(meetingCard(page).getByText(/Creating in \d+s/)).toBeVisible();
  await page.reload();
  await expect(meetingCard(page).getByText('Needs approval')).toBeVisible();
  await expect(meetingCard(page).getByText(/Activity/)).toBeVisible();
  await meetingCard(page).getByText(/Activity/).click();
  await expect(meetingCard(page).getByText(/page was refreshed before this action ran/)).toBeVisible();
  await expect(emailCard(page).getByText('Sent (simulated)', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('[data-tour="nav-mail"]').click();
  await expect(page.getByRole('listitem')).toHaveCount(1);
});

test('refresh while Cowork is working pauses the task with an explanation', async ({ page }) => {
  await loadLesson(page, 'Delegate with Cowork', 'Fast');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('button', { name: 'Looks good — continue' }).click();
  await page.getByRole('radio', { name: /Programme Leadership Group/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('radio', { name: /Fri 25 Sep/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Reviewing the programme briefing').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('.task-head')).toContainText('Paused');
  await expect(page.getByText(/Paused because the page was refreshed/)).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(emailCard(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.task-head')).toContainText('Needs approval');
});

test('cancel stops pending work and keeps completed actions', async ({ page }) => {
  await loadLesson(page, 'Review and approve');
  await emailCard(page).getByRole('button', { name: 'Send', exact: true }).click();
  await emailCard(page).getByRole('button', { name: 'Retry' }).click();
  await expect(emailCard(page).getByText('Sent (simulated)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel task' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel task' }).click();
  await expect(page.locator('.task-head')).toContainText('Cancelled');
  await expect(page.getByText(/Already completed before cancelling: the email/).first()).toBeVisible();
  await expect(meetingCard(page).getByText('Cancelled — not created')).toBeVisible();
});

test('progress survives refresh and reset clears everything', async ({ page }) => {
  await loadLesson(page, 'Use your agent');
  await page.reload();
  await expect(page.locator('.tbar')).toContainText('Use your agent');
  await expect(page.locator('nav')).toContainText('AI Programme Knowledge Agent');
  await page.getByRole('button', { name: 'Exit lesson' }).click();
  await expect(page.getByRole('button', { name: /Resume session/ })).toBeVisible();
  await page.getByRole('button', { name: 'Reset all training data' }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('button', { name: /Start the main journey/ })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('cclab:v1'));
  expect(stored === null || !stored.includes('AI Programme Knowledge Agent')).toBe(true);
});

test('downloads contain the promised formats', async ({ page }) => {
  await loadLesson(page, 'Review and approve');
  const zipDl = page.waitForEvent('download');
  await page.locator('.side-panel').getByRole('button', { name: /Download all/ }).click();
  const zip = await zipDl;
  const zipBytes = readFileSync((await zip.path())!);
  expect(zip.suggestedFilename()).toMatch(/\.zip$/);
  expect(zipBytes.readUInt32LE(0)).toBe(0x04034b50);
  const names = zipBytes.toString('latin1');
  for (const n of ['AI-programme-leadership-update.md', 'AI-programme-leadership-update.html', 'programme-status.csv', 'leadership-update-email.eml', 'risk-follow-up-invite.ics']) expect(names).toContain(n);

  const icsDl = page.waitForEvent('download');
  await page.locator('.side-panel .ks-row', { hasText: 'Meeting invitation' }).getByRole('button', { name: /Download/ }).click();
  const ics = readFileSync((await (await icsDl).path())!, 'utf8');
  expect(ics).toContain('BEGIN:VCALENDAR');
  expect(ics).toContain('TZID=Africa/Johannesburg');

  const csvDl = page.waitForEvent('download');
  await page.locator('.side-panel .ks-row', { hasText: 'Programme status table' }).getByRole('button', { name: /Download/ }).click();
  const csv = readFileSync((await (await csvDl).path())!, 'utf8');
  expect(csv.replace(/^﻿/, '').split('\r\n')[0]).toBe('Workstream,Status,Progress,Owner,Source,Data date');
});

test('practice: project delivery finds exactly the overdue items', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/welcome');
  await page.getByRole('button', { name: 'Practice exercises' }).click();
  await page.locator('.card', { hasText: 'Project delivery' }).getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('radio', { name: /Yes, copy the owners/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.locator('.task-scroll .file-chip', { hasText: 'Overdue work summary' }).first().click();
  const preview = page.locator('[data-tour="artifact-preview"]');
  for (const id of ['P-101', 'P-103', 'P-104']) await expect(preview.locator('td', { hasText: id })).toHaveCount(1);
  await expect(preview.locator('td', { hasText: 'P-106' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close preview' }).click();
  await shot(page, 'practice-delivery');
  await expect(emailCard(page)).toContainText('Pieter Botha');
});

test('practice: policy agent admits missing information', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/practice');
  await page.locator('.card', { hasText: 'Policy knowledge' }).getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Lagos per diem' }).click();
  await expect(page.locator('#main-content').getByText(/doesn't include the international daily allowance amounts/)).toBeVisible();
  await page.getByRole('textbox', { name: /Message Workplace Policy Helper/ }).fill('How many days must I be in the office?');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content').getByText(/at least two days per week/)).toBeVisible();
});

test('practice hub groups the workplace agents', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/practice');
  const group = page.getByRole('region', { name: 'Agents your teams will use' });
  for (const title of ['Policy & Procedures Navigator', 'Compliance & KYC Q&A', 'New Joiner Onboarding Buddy', 'Meeting to actions', 'Weekly status report', 'Customer case triage']) {
    await expect(group.locator('.card', { hasText: title })).toBeVisible();
  }
  await shot(page, 'practice-hub');
});

test('practice: compliance agent escalates what the procedure does not cover', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/practice');
  await page.locator('.card', { hasText: 'Compliance & KYC Q&A' }).getByRole('button', { name: /Start/ }).click();
  await page.getByRole('button', { name: 'Complaint timelines' }).click();
  await expect(page.locator('#main-content').getByText(/resolve it within/)).toBeVisible();
  await page.getByRole('textbox', { name: /Message Compliance Q&A/ }).fill('Can we onboard a customer with an expired passport?');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content').getByText(/doesn't cover that customer situation/)).toBeVisible();
  await shot(page, 'practice-compliance');
});

test('practice: case triage keeps the PIN out and escalates P1 cases', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/practice');
  await page.locator('.card', { hasText: 'Customer case triage' }).getByRole('button', { name: /Start/ }).click();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('radio', { name: /Yes — to Aisha Patel/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.locator('.task-scroll .file-chip', { hasText: 'Case triage sheet' }).first().click();
  const preview = page.locator('[data-tour="artifact-preview"]');
  for (const id of ['C-2201', 'C-2204', 'C-2205']) await expect(preview.locator('tr', { hasText: id })).toContainText('P1');
  await expect(preview).not.toContainText('4821');
  await page.getByRole('button', { name: 'Close preview' }).click();
  await expect(emailCard(page)).toContainText('Aisha Patel');
  await expect(emailCard(page)).not.toContainText('4821');
  await shot(page, 'practice-triage');
});

test('keyboard: Cowork questions work with arrows, Space and Submit', async ({ page }) => {
  await loadLesson(page, 'Delegate with Cowork');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('button', { name: 'Looks good — continue' }).click();
  const first = page.getByRole('radio').first();
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: /AI Programme Leads/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('When should the 30-minute follow-up happen?')).toBeVisible();
});

test('no dialog leaves the page hidden from assistive technology', async ({ page }) => {
  await loadLesson(page, 'Create and share');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Share', exact: true }).click();
  const share = page.getByRole('dialog', { name: /Share/ });
  await share.getByRole('textbox', { name: 'Add a name, group, or email' }).fill('cohort');
  await share.getByRole('option', { name: /Cohort/ }).click();
  await share.getByRole('button', { name: 'Share', exact: true }).click();
  await page.getByRole('button', { name: 'Open agent' }).click();
  await expect(page.getByRole('button', { name: 'Leadership briefing' })).toBeVisible();
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[aria-hidden="true"]')].filter((e) => e.contains(document.getElementById('main-content'))).length);
  expect(hidden).toBe(0);
});

test('presentation viewport renders without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await loadLesson(page, 'Review and approve');
  await shot(page, 'presentation-1920');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(emailCard(page).getByRole('button', { name: 'Send', exact: true })).toBeVisible();
  await shot(page, 'mobile-390');
});
