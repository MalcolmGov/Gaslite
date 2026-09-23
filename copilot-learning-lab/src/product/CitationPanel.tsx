import { useEffect, useRef } from 'react';
import { Button } from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { useLab } from '../state/store';
import { closeCitation } from '../state/uiActions';
import { resolveCitation } from '../scenario/registry';
import { fmtDate, daysBetween } from '../lib/util';
import { settings } from '../config/settings';
import { Banner, Markdown } from './common';
import { DocumentView } from './DocumentView';

/** Opens the exact supporting excerpt for a citation, within its document. */
export function CitationPanel() {
  const c = useLab((s) => s.ui.citation);
  const brief = useLab((s) => (c?.taskId ? s.tasks[c.taskId]?.context.brief : undefined));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!c) return;
    ref.current?.focus();
    const el = document.getElementById(`sec-${c.id}`);
    el?.scrollIntoView({ block: 'center' });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCitation(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [c]);

  if (!c) return null;
  const r = resolveCitation(c.id, brief?.text, brief ? `From ${brief.agentName}, carried into this task on ${fmtDate(settings.scenario.today)}` : undefined);
  const age = r.doc ? daysBetween(r.doc.modified, settings.scenario.today) : 0;

  return (
    <aside className="panel" role="dialog" aria-modal="false" aria-labelledby="cite-title" ref={ref} tabIndex={-1}>
      <div className="panel-head">
        <div>
          <div className="xsmall muted">Source</div>
          <h2 id="cite-title">{r.pseudo?.title ?? r.doc?.title ?? 'Source not found'}</h2>
          {r.section && <div className="small muted">{r.section.heading}</div>}
        </div>
        <Button appearance="subtle" icon={<DismissRegular />} aria-label="Close source" onClick={closeCitation} />
      </div>
      <div className="panel-body">
        {r.pseudo && (
          <>
            <p className="small muted">{r.pseudo.subtitle}</p>
            <div className="excerpt"><Markdown text={r.pseudo.text} /></div>
          </>
        )}
        {r.doc && (
          <div className="stack" style={{ gap: 10 }}>
            {r.doc.supersededBy && (
              <Banner tone="warning" title="Outdated source.">This file is superseded by a newer version. Check dates before relying on it.</Banner>
            )}
            {!r.doc.supersededBy && age > 45 && (
              <Banner tone="info">This document was last modified {age} days before the scenario date. Check whether newer information exists.</Banner>
            )}
            <DocumentView doc={r.doc} highlight={c.id} />
          </div>
        )}
        {!r.doc && !r.pseudo && <p>This citation couldn't be resolved.</p>}
      </div>
    </aside>
  );
}
