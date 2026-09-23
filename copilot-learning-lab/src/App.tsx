import { useEffect } from 'react';
import { FluentProvider, webLightTheme, type Theme } from '@fluentui/react-components';
import { useLab } from './state/store';
import { syncProgress } from './state/trainingActions';
import { Shell } from './product/Shell';
import { ChatPage } from './product/ChatPage';
import { AgentBuilder } from './product/builder/AgentBuilder';
import { AgentChatPage, AgentsListPage } from './product/agent/AgentPages';
import { CoworkHome } from './product/cowork/CoworkHome';
import { TaskPage } from './product/cowork/TaskPage';
import { MailPage } from './product/MailPage';
import { KnowledgePicker } from './product/KnowledgePicker';
import { CitationPanel } from './product/CitationPanel';
import { TrainingBar } from './training/TrainingBar';
import { Coach } from './training/Coach';
import { FacilitatorDrawer, InfoDrawer, LessonDrawer } from './training/Drawers';
import { CompletionPage, PracticeHub, PracticePanel, WelcomePage } from './training/Pages';

const theme: Theme = {
  ...webLightTheme,
  fontFamilyBase: "'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",
};

function ProductRoute() {
  const route = useLab((s) => s.route);
  switch (route.name) {
    case 'chat':
      return <ChatPage />;
    case 'builder':
      return <AgentBuilder agentId={route.agentId} tab={route.tab} />;
    case 'agent':
      return <AgentChatPage agentId={route.agentId} />;
    case 'agents':
      return <AgentsListPage />;
    case 'cowork':
      return <CoworkHome />;
    case 'task':
      return <TaskPage taskId={route.taskId} />;
    case 'mail':
      return <MailPage tab={route.tab} />;
    default:
      return <ChatPage />;
  }
}

export function App() {
  const route = useLab((s) => s.route.name);
  const drawer = useLab((s) => s.ui.drawer);
  const scale = useLab((s) => s.facilitator.textScale);
  const announcement = useLab((s) => s.ui.announcement);
  const mode = useLab((s) => s.session.mode);

  // Record step completion from real application events.
  useEffect(() => useLab.subscribe(() => syncProgress()), []);

  const trainingPage = route === 'welcome' || route === 'complete' || route === 'practice';

  return (
    <FluentProvider theme={theme} style={{ height: '100%', background: 'transparent' }}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="app-root" style={{ zoom: scale } as React.CSSProperties}>
        <TrainingBar />
        <div className="app-scaled">
          {route === 'welcome' ? (
            <main id="main-content" style={{ flex: 1, overflow: 'auto' }} tabIndex={-1}><WelcomePage /></main>
          ) : route === 'complete' ? (
            <main id="main-content" style={{ flex: 1, overflow: 'auto' }} tabIndex={-1}><CompletionPage /></main>
          ) : route === 'practice' ? (
            <main id="main-content" style={{ flex: 1, overflow: 'auto' }} tabIndex={-1}><PracticeHub /></main>
          ) : (
            <Shell>
              <ProductRoute />
              <CitationPanel />
            </Shell>
          )}
        </div>
        {!trainingPage && <Coach />}
        <PracticePanel />
        {drawer === 'lesson' && <LessonDrawer />}
        {drawer === 'facilitator' && mode === 'facilitator' && <FacilitatorDrawer />}
        {drawer === 'info' && <InfoDrawer />}
        <KnowledgePicker />
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </FluentProvider>
  );
}
