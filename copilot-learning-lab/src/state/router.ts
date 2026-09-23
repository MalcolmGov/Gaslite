import { mutate, useLab, type Route } from './store';
import { clearStaleAriaHidden } from '../product/common';

/** Hash routing so prototype links (e.g. to a shared agent) can be opened directly. */

export function routeToHash(r: Route): string {
  switch (r.name) {
    case 'builder':
      return `#/builder/${r.agentId}${r.tab ? '/' + r.tab : ''}`;
    case 'agent':
      return `#/agents/${r.agentId}`;
    case 'task':
      return `#/cowork/tasks/${r.taskId}`;
    case 'mail':
      return `#/mail${r.tab ? '/' + r.tab : ''}`;
    default:
      return `#/${r.name}`;
  }
}

export function hashToRoute(hash: string): Route | null {
  const p = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!p.length) return null;
  switch (p[0]) {
    case 'welcome':
    case 'chat':
    case 'agents':
      if (p[0] === 'agents' && p[1]) return { name: 'agent', agentId: p[1] };
      return { name: p[0] } as Route;
    case 'builder':
      return p[1] ? { name: 'builder', agentId: p[1], tab: (p[2] as 'describe' | 'configure' | 'try') || undefined } : null;
    case 'cowork':
      return p[1] === 'tasks' && p[2] ? { name: 'task', taskId: p[2] } : { name: 'cowork' };
    case 'mail':
      return { name: 'mail', tab: (p[1] as 'sent' | 'calendar') || 'sent' };
    case 'complete':
    case 'practice':
      return { name: p[0] };
    default:
      return null;
  }
}

export function navigate(r: Route) {
  mutate((s) => {
    s.route = r;
    s.ui.citation = null;
  });
  const h = routeToHash(r);
  if (window.location.hash !== h) window.history.pushState(null, '', h);
  // Move focus to the main landmark for keyboard and screen-reader users.
  requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
  setTimeout(clearStaleAriaHidden, 400);
}

export function initRouter() {
  const apply = () => {
    const r = hashToRoute(window.location.hash);
    if (r && JSON.stringify(r) !== JSON.stringify(useLab.getState().route)) mutate((s) => { s.route = r; });
  };
  window.addEventListener('popstate', apply);
  window.addEventListener('hashchange', apply);
  if (window.location.hash) apply();
  else window.history.replaceState(null, '', routeToHash(useLab.getState().route));
}

export const agentLink = (agentId: string) => `${window.location.origin}${window.location.pathname}#/agents/${agentId}`;
