import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';
import { useLab } from './state/store';
import { initRouter } from './state/router';
import { onAppLoad } from './state/trainingActions';

/** Wait for persisted state, recover interrupted work, then render. */
function boot() {
  onAppLoad();
  initRouter();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (useLab.persist.hasHydrated()) boot();
else useLab.persist.onFinishHydration(() => boot());
