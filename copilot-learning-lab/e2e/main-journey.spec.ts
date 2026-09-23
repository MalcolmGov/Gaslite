import { expect, test } from '@playwright/test';
import { buildAgent, freshStart, send, setSpeed, shot } from './helpers';

/**
 * The complete main journey, as a new learner would do it in Guided mode:
 * Chat → build agent → test A/B/C → improve & rerun → create & share →
 * use agent → handoff → Cowork task → fix stale source → approvals
 * (including a failed send + retry) → results.
 */
test('main journey end to end', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await freshStart(page);
  const main = page.locator('#main-content');
  await shot(page, '01-chat');
  await setSpeed(page, 'Fast');
  await page.locator('#mode-select').selectOption('guided');

  // Lesson 1
  await page.getByRole('button', { name: /difference between an agent and Cowork/ }).click();
  await expect(main.getByText('Here\'s how the three experiences differ')).toBeVisible();

  // Lesson 2 — create
  await page.locator('[data-tour="nav-new-agent"]').click();
  await shot(page, '02-builder-intro');
  await page.getByRole('button', { name: /Use the exercise description/ }).click();
  await send(page);
  await expect(main.getByText('Who will use this agent?')).toBeVisible();
  await page.getByRole('button', { name: 'The AI and Automation programme team' }).click();
  await page.getByRole('button', { name: 'Choose programme documents' }).click();
  const picker = page.getByRole('dialog', { name: 'Add knowledge' });
  await expect(picker).toBeVisible();
  // Try the restricted file first: access denied + an alternative is offered.
  await picker.getByRole('textbox', { name: 'Search files' }).fill('budget');
  await picker.getByText('FY2027 Budget Submission - Draft.xlsx').click();
  await expect(picker.getByText('Access denied.')).toBeVisible();
  await shot(page, '03-picker-restricted');
  await picker.getByRole('textbox', { name: 'Search files' }).fill('');
  await picker.getByText('Weekly Delivery Tracker.xlsx').first().click();
  await expect(picker.getByText('Superseded.')).toBeVisible();
  await picker.getByRole('button', { name: 'Select the newer version instead' }).click();
  await picker.getByRole('tab', { name: 'AI & Automation Programme' }).click();
  for (const label of [/Select AI Programme Overview\.docx/, /Select Training Attendance Register/, /Select Programme Governance Guide/, /Select Steering Meeting Notes/]) {
    await picker.getByRole('checkbox', { name: label }).check();
  }
  await shot(page, '04-picker');
  await picker.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(main.getByText('What should its answers include?')).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: "Say it's missing and suggest a next step" }).click();
  await expect(main.getByText('Your agent is set up.')).toBeVisible();
  await shot(page, '05-describe-done');
  await page.getByRole('tab', { name: 'Configure' }).click();
  await expect(page.getByLabel('Name')).toHaveValue('AI Programme Knowledge Agent');
  await expect(page.locator('#ag-instr')).toHaveValue(/If the information is missing, say so\./);
  await expect(main.getByText('Ready').first()).toBeVisible();
  await shot(page, '06-configure');

  // Lesson 3 — test
  await page.getByRole('tab', { name: 'Try it' }).click();
  const cases = page.locator('[data-tour="test-cases"]');
  await cases.getByRole('button', { name: 'Run test' }).first().click();
  await expect(main.getByText('Test A: good behaviour')).toBeVisible();
  await page.locator('.md .cite').first().click();
  await expect(page.getByRole('dialog', { name: /Weekly Delivery Tracker — Week 38/ })).toBeVisible();
  await expect(page.locator('.excerpt')).toContainText('Risks');
  await shot(page, '07-citation');
  await page.getByRole('button', { name: 'Close source' }).click();
  await cases.getByRole('button', { name: 'Run test' }).first().click();
  await expect(main.getByText('Test B: good behaviour')).toBeVisible();
  await expect(main.getByText(/can't find an approved budget for next year/)).toBeVisible();
  await cases.getByRole('button', { name: 'Run test' }).first().click();
  await expect(main.getByText('Test C: good behaviour')).toBeVisible();
  await shot(page, '08-tests');

  // Improve (here: weaken, to see the effect) and rerun C.
  await page.getByRole('tab', { name: 'Configure' }).click();
  const instr = page.locator('#ag-instr');
  await instr.fill((await instr.inputValue()).replace('Separate confirmed information from assumptions. ', ''));
  await page.getByRole('tab', { name: 'Try it' }).click();
  await cases.getByRole('button', { name: 'Run again' }).nth(2).click();
  await expect(main.getByText('Test C: needs work')).toBeVisible();
  await page.getByRole('button', { name: /Compare with config v1/ }).last().click();
  await shot(page, '09-compare');
  // Restore the stronger instruction.
  await page.getByRole('tab', { name: 'Configure' }).click();
  await instr.fill((await instr.inputValue()).replace('If the information is missing', 'Separate confirmed information from assumptions. If the information is missing'));
  await page.getByRole('tab', { name: 'Try it' }).click();

  // Lesson 4 — create & share
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByRole('dialog').getByText('private and only available to you')).toBeVisible();
  await shot(page, '10-created');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const share = page.getByRole('dialog', { name: /Share "AI Programme Knowledge Agent"/ });
  await share.getByRole('textbox', { name: 'Add a name, group, or email' }).fill('cohort');
  await share.getByRole('option', { name: /AI Training Cohort — Wave 2/ }).click();
  await expect(share.getByText("Audience can't open")).toBeVisible(); // steering notes
  await shot(page, '11-share');
  await share.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Agent shared' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Agent chat link' })).toHaveValue(/#\/agents\/agt_/);
  await page.getByRole('button', { name: 'Open agent' }).click();

  // Lesson 5 — use the agent
  await page.locator('[data-tour="agent-starters"]').getByRole('button', { name: 'Leadership briefing' }).click();
  await expect(main.getByText('Weekly AI programme briefing')).toBeVisible();
  await page.getByRole('button', { name: 'Show the source for this risk.' }).click();
  await expect(main.getByText(/The top risk \(R1\) comes from/)).toBeVisible();
  await page.getByRole('button', { name: 'Turn this into a leadership-ready summary.' }).click();
  await expect(main.getByText('AI Programme — Leadership Summary')).toBeVisible();
  await shot(page, '12-agent-chat');
  await page.getByRole('button', { name: 'Use this briefing in the Cowork exercise' }).click();
  await page.getByRole('button', { name: 'Copy briefing into a new Cowork task' }).click();

  // Lesson 6 — Cowork
  await expect(main.getByText('Review your request')).toBeVisible();
  await expect(main.getByText('Programme briefing (reviewed)')).toBeVisible();
  await shot(page, '13-task-ready');
  await send(page);
  await page.getByRole('button', { name: 'Looks good — continue' }).click();
  await page.getByRole('radio', { name: /Programme Leadership Group/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('radio', { name: /Thu 24 Sep, 10:00/ }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('group', { name: 'Email approval' })).toBeVisible();
  await expect(main.getByText(/The attached tracker is \*\*|The attached tracker is/)).toBeVisible();
  await shot(page, '14-approvals');

  // Lesson 7 — review: stale milestone → source → replace → regenerate
  await page.locator('.task-scroll [data-tour="output-update"]').click();
  const preview = page.locator('[data-tour="artifact-preview"]');
  await expect(preview).toContainText('25 Sep 2026');
  await preview.locator('.cite').nth(0).click();
  await expect(main.getByText('Outdated source.')).toBeVisible();
  await shot(page, '15-stale-source');
  await page.getByRole('button', { name: 'Close source' }).click();
  await expect(preview.getByText("You checked the source: it's outdated")).toBeVisible();
  await preview.getByRole('button', { name: 'Replace with Week 38' }).click();
  await preview.getByRole('button', { name: 'Regenerate affected outputs' }).click();
  await expect(preview).toContainText('9 Oct 2026');
  await shot(page, '16-regenerated');
  await page.getByRole('button', { name: 'Close preview' }).click();

  // Email: send → simulated connector failure → retry (no duplicate)
  const email = page.getByRole('group', { name: 'Email approval' });
  await expect(email).toContainText('9 Oct');
  await email.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000); // on screen long enough to count as reviewed
  await email.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(email.getByText(/connector timed out/)).toBeVisible();
  await shot(page, '17-failed');
  await email.getByRole('button', { name: 'Retry' }).click();
  await expect(email.getByText('Sent (simulated)', { exact: true })).toBeVisible();

  // Meeting: resolve the conflict, then create
  const meeting = page.getByRole('group', { name: 'Meeting approval' });
  await meeting.scrollIntoViewIfNeeded();
  await expect(meeting.getByText(/Thandi Nkosi.*is busy/)).toBeVisible();
  await page.waitForTimeout(2000);
  await meeting.getByRole('button', { name: /Use first free time/ }).click();
  await expect(meeting.getByText('No conflicts in sample calendars.')).toBeVisible();
  await meeting.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(meeting.getByText('Created (simulated)', { exact: true })).toBeVisible();
  await expect(page.locator('.task-head')).toContainText('Completed');
  await shot(page, '18-completed');

  // Results
  await page.locator('[data-tour="nav-mail"]').click();
  await expect(page.getByRole('listitem').filter({ hasText: 'AI programme weekly update' })).toHaveCount(1);
  await shot(page, '19-sent-items');
  await page.getByRole('button', { name: 'See your results' }).click();
  await expect(main.getByText('Skills practised')).toBeVisible();
  await shot(page, '20-results');
  const text = await page.locator('.tpage').innerText();
  for (const skill of ['Defined a clear agent purpose', 'Chose appropriate sources', 'Tested an answerable question', 'Tested missing information', 'Reviewed evidence', 'Selected an appropriate sharing audience', 'Provided a clear Cowork objective', 'Checked recipients and outputs', 'Handled an approval correctly', 'Recovered from an error']) {
    expect(text).toContain(skill);
  }
  expect(errors).toEqual([]);
});

test('agent built via helper answers the three tests', async ({ page }) => {
  await freshStart(page);
  await setSpeed(page, 'Instant');
  await buildAgent(page);
});
