import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components';
import { QuestionCircleRegular } from '@fluentui/react-icons';

/** Plain-language explanations of terms, styled as Learning Lab help (not product UI). */
export const GLOSSARY: Record<string, { term: string; text: string }> = {
  grounding: {
    term: 'Grounding',
    text: 'Basing an answer on specific sources — here, the documents you chose. Grounded answers can be checked against the source; ungrounded ones are the AI\'s best guess.',
  },
  knowledge: {
    term: 'Knowledge sources',
    text: 'The files, sites or connectors an agent may use to answer. Choose current, approved files. Removing a source means the agent stops using it.',
  },
  permissions: {
    term: 'Permissions',
    text: 'People only get answers from content they are allowed to open. Sharing an agent does not give anyone access to its files.',
  },
  approval: {
    term: 'Action approval',
    text: 'Before Cowork sends an email or creates a meeting, it shows you exactly what it will do. Nothing happens until you approve that specific action.',
  },
  citation: {
    term: 'Citation',
    text: 'A numbered link to the passage an answer relies on. Open it to check the wording and the date of the source.',
  },
};

export function HelpTip({ term }: { term: keyof typeof GLOSSARY }) {
  const g = GLOSSARY[term];
  return (
    <Popover withArrow positioning="below">
      <PopoverTrigger disableButtonEnhancement>
        <button type="button" className="icon-btn" style={{ width: 24, height: 24, color: 'var(--train)' }} aria-label={`Learning Lab help: ${g.term}`}>
          <QuestionCircleRegular fontSize={16} />
        </button>
      </PopoverTrigger>
      <PopoverSurface style={{ maxWidth: 300, border: '1.5px dashed var(--train-stroke)', background: 'var(--train-bg)' }}>
        <div className="small">
          <span className="tpill" style={{ marginBottom: 6 }}>Learning Lab</span>
          <div style={{ fontWeight: 600, margin: '6px 0 4px' }}>{g.term}</div>
          <div>{g.text}</div>
        </div>
      </PopoverSurface>
    </Popover>
  );
}
