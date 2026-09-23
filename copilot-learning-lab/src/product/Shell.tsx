import { useEffect, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Avatar, Tooltip } from '@fluentui/react-components';
import {
  AddRegular,
  AppsListRegular,
  BotAddRegular,
  CalendarLtrRegular,
  ChatRegular,
  NavigationRegular,
  PanelLeftContractRegular,
  SearchRegular,
  SettingsRegular,
  TaskListLtrRegular,
  ArrowRepeatAllRegular,
  MailRegular,
} from '@fluentui/react-icons';
import { settings } from '../config/settings';
import { useLab } from '../state/store';
import { navigate } from '../state/router';
import { startNewAgent } from '../state/agentActions';
import { AgentIcon } from './common';

/** Microsoft 365 Copilot-style frame: navigation pane, top bar with the Chat / Cowork toggle. */
export function Shell({ children }: { children: ReactNode }) {
  const route = useLab((s) => s.route);
  const agents = useLab(useShallow((s) => s.agentOrder.map((id) => s.agents[id]).filter(Boolean)));
  const tasks = useLab(useShallow((s) => s.taskOrder.map((id) => s.tasks[id]).filter(Boolean)));
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const inCowork = route.name === 'cowork' || route.name === 'task';
  const current = (r: string, id?: string) =>
    route.name === r && (!id || (route as { agentId?: string; taskId?: string }).agentId === id || (route as { taskId?: string }).taskId === id) ? 'page' : undefined;
  const narrow = () => typeof window !== 'undefined' && window.innerWidth < 900;
  // Collapse the navigation when the window becomes narrow (small screens, zoom).
  useEffect(() => {
    const onResize = () => { if (narrow()) setCollapsed(true); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const go = (fn: () => void) => () => { fn(); if (narrow()) setCollapsed(true); };

  return (
    <div className="product">
      <nav className={`nav ${collapsed ? 'collapsed mobile-hidden' : ''}`} aria-label="Copilot navigation">
        <div className="nav-top">
          <Tooltip content={collapsed ? 'Expand navigation' : 'Collapse navigation'} relationship="label">
            <button className="icon-btn" onClick={() => setCollapsed((c) => !c)}>{collapsed ? <NavigationRegular fontSize={20} /> : <PanelLeftContractRegular fontSize={20} />}</button>
          </Tooltip>
          {!collapsed && <span style={{ fontWeight: 600, fontSize: 15 }}>Copilot</span>}
        </div>
        {!collapsed && (
          <div className="nav-scroll">
            {inCowork ? (
              <>
                <button className="nav-item" aria-current={current('cowork')} onClick={go(() => navigate({ name: 'cowork' }))}><AddRegular fontSize={20} /><span className="grow">New task</span></button>
                <div className="nav-section">My tasks</div>
                {tasks.length === 0 && <p className="xsmall muted" style={{ padding: '0 8px' }}>No tasks yet.</p>}
                {tasks.slice(0, 12).map((t) => (
                  <button key={t.id} className="nav-item" aria-current={current('task', t.id)} onClick={go(() => navigate({ name: 'task', taskId: t.id }))}>
                    <TaskListLtrRegular fontSize={18} />
                    <span className="grow">{t.title}</span>
                    {t.unread && <span className="sr-only">unread</span>}
                    {t.unread && <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--brand)' }} />}
                  </button>
                ))}
                <div className="nav-section">Cowork</div>
                <DisabledItem icon={<ArrowRepeatAllRegular fontSize={20} />} label="Automations" why="Scheduled and event-driven tasks aren't part of this training." />
                <DisabledItem icon={<SettingsRegular fontSize={20} />} label="Customize" why="Custom instructions, skills and plugins aren't part of this training." />
              </>
            ) : (
              <>
                <button className="nav-item" aria-current={current('chat')} onClick={go(() => navigate({ name: 'chat' }))}><ChatRegular fontSize={20} /><span className="grow">New chat</span></button>
                <DisabledItem icon={<SearchRegular fontSize={20} />} label="Search" why="Search across your organisation isn't available in this simulation." />
                <div className="nav-section">Agents</div>
                {agents.filter((a) => a.status === 'created').map((a) => (
                  <button key={a.id} className="nav-item" aria-current={current('agent', a.id)} onClick={go(() => navigate({ name: 'agent', agentId: a.id }))}>
                    <AgentIcon name={a.name} policy={a.packId === 'policy'} />
                    <span className="grow">{a.name}</span>
                  </button>
                ))}
                <button className="nav-item" data-tour="nav-new-agent" onClick={go(() => startNewAgent())}><BotAddRegular fontSize={20} /><span className="grow">New agent</span></button>
                <button className="nav-item" aria-current={current('agents')} onClick={go(() => navigate({ name: 'agents' }))}><AppsListRegular fontSize={20} /><span className="grow">All agents</span></button>
              </>
            )}
            <div className="nav-section">Simulated Outlook</div>
            <button className="nav-item" data-tour="nav-mail" aria-current={route.name === 'mail' ? 'page' : undefined} onClick={go(() => navigate({ name: 'mail', tab: 'sent' }))}>
              <MailRegular fontSize={20} /><span className="grow">Sent items &amp; calendar</span>
            </button>
          </div>
        )}
        {!collapsed && (
          <div className="nav-foot">
            <Avatar name={settings.learner.displayName} size={28} color="colorful" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.learner.displayName}</div>
              <div className="xsmall muted">Sample profile · no sign-in</div>
            </div>
          </div>
        )}
      </nav>
      <div className="main-col">
        <header className="topbar">
          <div className="app-name">
            {collapsed && (
              <Tooltip content="Open navigation" relationship="label">
                <button className="icon-btn" onClick={() => setCollapsed(false)}><NavigationRegular fontSize={20} /></button>
              </Tooltip>
            )}
            {settings.brand.copilotLogoUrl ? <img src={settings.brand.copilotLogoUrl} alt="" width={20} height={20} /> : null}
            <span>Microsoft 365 Copilot</span>
          </div>
          <div className="seg" role="group" aria-label="Experience">
            <button aria-pressed={!inCowork} onClick={() => navigate({ name: 'chat' })}>Chat</button>
            <button aria-pressed={inCowork} data-tour="toggle-cowork" onClick={() => navigate({ name: 'cowork' })}>Cowork</button>
          </div>
          <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip content="Simulated calendar" relationship="label">
              <button className="icon-btn" onClick={() => navigate({ name: 'mail', tab: 'calendar' })}><CalendarLtrRegular fontSize={20} /></button>
            </Tooltip>
          </div>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function DisabledItem({ icon, label, why }: { icon: ReactNode; label: string; why: string }) {
  return (
    <Tooltip content={why} relationship="description">
      <button className="nav-item" aria-disabled="true" style={{ color: 'var(--text-3)' }} onClick={(e) => e.preventDefault()}>
        {icon}<span className="grow">{label}</span>
      </button>
    </Tooltip>
  );
}
