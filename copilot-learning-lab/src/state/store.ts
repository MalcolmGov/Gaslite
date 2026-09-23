import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { settings } from '../config/settings';
import { newId } from '../lib/util';
import type { Speed } from '../lib/scheduler';
import type {
  Agent,
  Artifact,
  ChatMessage,
  CreatedEvent,
  LearningEvent,
  LearningEventType,
  OutboundAction,
  SentItem,
  Task,
} from '../engine/model';

/**
 * Application state.
 *
 * One store, split into clear slices: session (training), product data
 * (agents, tasks, artifacts, actions, mailbox, calendar), learning events,
 * facilitator settings, and transient UI. Action functions live in sibling
 * modules (agentActions, coworkActions, trainingActions) and mutate the store
 * through `mutate()`. Only durable slices are persisted to localStorage.
 */

export type Route =
  | { name: 'welcome' }
  | { name: 'chat' }
  | { name: 'builder'; agentId: string; tab?: 'describe' | 'configure' | 'try' }
  | { name: 'agent'; agentId: string }
  | { name: 'agents' }
  | { name: 'cowork' }
  | { name: 'task'; taskId: string }
  | { name: 'mail'; tab?: 'sent' | 'calendar' }
  | { name: 'complete' }
  | { name: 'practice' };

export type Mode = 'guided' | 'practice' | 'facilitator';

export interface SessionState {
  started: boolean;
  mode: Mode;
  lessonId: string;
  completedSteps: string[];
  completedLessons: string[];
  startedAt?: number;
  /** Active practice exercise id, if any. */
  practiceId?: string;
  completedPractice: string[];
  /** Id of the agent the main scenario uses. */
  mainAgentId?: string;
  mainTaskId?: string;
}

export interface FacilitatorState {
  speed: Speed;
  textScale: 1 | 1.15 | 1.3;
  hideHints: boolean;
  showNotes: boolean;
  failures: { connectorOnce: boolean; missingSource: boolean };
  consumed: { connector?: boolean; missingSource?: boolean };
}

export interface UiState {
  toolbarCollapsed: boolean;
  drawer: null | 'lesson' | 'facilitator' | 'info';
  hintOpen: boolean;
  citation: null | { id: string; taskId?: string };
  announcement: string;
  pickerOpen: null | { purpose: 'agent' | 'chat' | 'cowork'; targetId?: string };
  coachCollapsed: boolean;
  /** Transient busy flags, e.g. "reply:agt_1:try", "create:agt_1". */
  busy: Record<string, boolean>;
}

export interface LabState {
  session: SessionState;
  route: Route;
  agents: Record<string, Agent>;
  agentOrder: string[];
  copilotChat: { messages: ChatMessage[]; attached: string[] };
  coworkDraft: { prompt: string; files: string[]; briefFromAgent?: { text: string; agentName: string; at: number } };
  tasks: Record<string, Task>;
  taskOrder: string[];
  artifacts: Record<string, Artifact>;
  actions: Record<string, OutboundAction>;
  mailbox: SentItem[];
  calendar: CreatedEvent[];
  events: LearningEvent[];
  facilitator: FacilitatorState;
  feedback?: { rating: number; comment: string; at: number };
  ui: UiState;
}

export const initialUi = (): UiState => ({
  toolbarCollapsed: false,
  drawer: null,
  hintOpen: false,
  citation: null,
  announcement: '',
  pickerOpen: null,
  coachCollapsed: false,
  busy: {},
});

export const initialFacilitator = (): FacilitatorState => ({
  speed: 'fast',
  textScale: 1,
  hideHints: false,
  showNotes: false,
  failures: { connectorOnce: true, missingSource: false },
  consumed: {},
});

export function initialState(): LabState {
  return {
    session: { started: false, mode: 'guided', lessonId: 'intro', completedSteps: [], completedLessons: [], completedPractice: [] },
    route: { name: 'welcome' },
    agents: {},
    agentOrder: [],
    copilotChat: { messages: [], attached: [] },
    coworkDraft: { prompt: '', files: [] },
    tasks: {},
    taskOrder: [],
    artifacts: {},
    actions: {},
    mailbox: [],
    calendar: [],
    events: [],
    facilitator: initialFacilitator(),
    ui: initialUi(),
  };
}

type Persisted = Omit<LabState, 'ui'>;

export const useLab = create<LabState>()(
  persist(
    immer(() => initialState()),
    {
      name: settings.storageKey,
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return window.localStorage;
        } catch {
          // Private mode or blocked storage: fall back to memory-only.
          const mem = new Map<string, string>();
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
        }
      }),
      partialize: (s): Persisted => {
        const { ui: _ui, ...rest } = s;
        return rest;
      },
      merge: (persisted, current) => ({ ...current, ...(persisted as Persisted), ui: initialUi() }),
    },
  ),
);

/** Mutate the store with an immer recipe. */
export const mutate = (fn: (s: LabState) => void) => useLab.setState((s) => { fn(s); });
export const lab = () => useLab.getState();

/** Record a learning event. Only real application events are recorded. */
export function logEvent(s: LabState, type: LearningEventType, data?: LearningEvent['data']) {
  s.events.push({ id: newId('evt'), type, at: Date.now(), data });
}

export function announce(text: string) {
  mutate((s) => {
    // Toggle a zero-width char so identical consecutive messages are re-announced.
    s.ui.announcement = s.ui.announcement.endsWith('​') ? text : text + '​';
  });
}
