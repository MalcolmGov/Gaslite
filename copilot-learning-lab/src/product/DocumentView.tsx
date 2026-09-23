import type { SampleDocument } from '../scenario/types';
import { fmtDate } from '../lib/util';
import { FileIcon } from './common';

/** Read-only rendering of a sample document, optionally highlighting one section. */
export function DocumentView({ doc, highlight }: { doc: SampleDocument; highlight?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <FileIcon kind={doc.kind} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{doc.title}</div>
          <div className="xsmall muted">{doc.fileName}</div>
        </div>
      </div>
      <dl className="docmeta">
        <dt>Version</dt><dd>{doc.version}</dd>
        <dt>Modified</dt><dd>{fmtDate(doc.modified)}</dd>
        <dt>Owner</dt><dd>{doc.owner}</dd>
        <dt>Classification</dt><dd>{doc.classification}</dd>
        <dt>Location</dt><dd>{doc.location}</dd>
      </dl>
      <p className="small muted" style={{ margin: '10px 0' }}>{doc.summary}</p>
      {doc.sections.map((s) => (
        <section key={s.id} id={`sec-${s.id}`} className={highlight === s.id ? 'excerpt' : ''} style={highlight === s.id ? undefined : { margin: '10px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{s.heading}{highlight === s.id && <span className="sr-only"> (cited excerpt)</span>}</div>
          {s.text && (
            <div className="small" style={{ lineHeight: 1.5 }}>
              {s.text.split('\n').map((l, i) => (l.startsWith('- ') ? <div key={i}>• {l.slice(2)}</div> : <div key={i}>{l}</div>))}
            </div>
          )}
          {s.table && (
            <div className="md">
              <table>
                <thead><tr>{s.table.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
                <tbody>{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
