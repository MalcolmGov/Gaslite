/**
 * Central settings for the Learning Lab.
 *
 * Everything organisation-specific lives here so the lab can be re-labelled
 * for another business unit without touching components. All people, email
 * addresses and figures used by the scenarios are synthetic.
 */
export const settings = {
  appName: 'Copilot & Cowork — Interactive Learning Lab',
  shortName: 'Learning Lab',

  organisation: {
    name: 'MTN Group Fintech',
    /** Training-only team used by the scenario. Fictional. */
    team: 'AI and Automation (training version)',
    /** Reserved example domain so no address can ever resolve to a real mailbox. */
    emailDomain: 'fintech-training.example',
    /** Small accent used only in the training toolbar, never in product surfaces. */
    accentColor: '#FFCB05',
  },

  learner: {
    id: 'usr_learner',
    displayName: 'Malcolm Govender',
    /** Local part of the learner's simulated email address. */
    emailUser: 'malcolm.govender',
    jobTitle: 'Programme Analyst',
    initials: 'MG',
  },

  scenario: {
    /** The simulated "today" for every scenario, so dates never drift. */
    today: '2026-09-22',
    timeZone: 'Africa/Johannesburg',
    timeZoneLabel: 'SAST',
    utcOffset: '+02:00',
  },

  labels: {
    persistent: 'Training simulation · Sample data',
    infoPanel: 'Internal training experience. Not a live Microsoft service.',
    certificate: 'Internal training completion record — not a Microsoft certification',
  },

  /**
   * Official Microsoft brand assets are not bundled. If your organisation is
   * licensed to use them, place the file in /public and set the path here.
   */
  brand: {
    copilotLogoUrl: '' as string,
  },

  /** Local storage key. Bump the suffix when the persisted shape changes. */
  storageKey: 'cclab:v1',
} as const;

export type Settings = typeof settings;
