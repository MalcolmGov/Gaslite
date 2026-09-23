import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components';

export const EXPERIENCES = [
  { name: 'Copilot Chat', use: 'Ask questions, analyse information you attach, and draft content in one conversation.', example: '"Summarise this tracker."' },
  { name: 'Agent Builder agent', use: 'A reusable assistant with standing instructions and chosen knowledge, shared with colleagues.', example: '"What changed in the programme this week?" — answered from approved documents.' },
  { name: 'Cowork', use: 'Delegate a multi-step task. Cowork produces files and asks for approval before actions such as sending email.', example: '"Prepare the update, draft the email, propose a meeting."' },
  { name: 'Copilot Studio (optional)', use: 'Advanced agents: choose the AI model, add actions that call other systems, automated flows, multiple channels and formal publishing.', example: 'A merchant-support agent that looks up cases in a service system.' },
];

/** Training explanation of where Copilot Studio fits. Not a product surface. */
export function StudioDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: 640, borderTop: '4px solid var(--train)' }}>
        <DialogBody>
          <DialogTitle><span className="tpill">Learning Lab</span> Chat, agents, Cowork and Copilot Studio</DialogTitle>
          <DialogContent>
            <div className="stack" style={{ gap: 10 }}>
              {EXPERIENCES.map((e) => (
                <div key={e.name} className="card" style={{ boxShadow: 'none' }}>
                  <strong>{e.name}</strong>
                  <p className="small" style={{ margin: '4px 0' }}>{e.use}</p>
                  <p className="xsmall muted" style={{ margin: 0 }}>Example: {e.example}</p>
                </div>
              ))}
              <p className="small">
                Agents built with Agent Builder answer from their instructions and knowledge. They don't automatically connect to any system, run workflows, or get invoked inside Cowork. For integrations and actions, organisations use Copilot Studio — this lab only explains it.
              </p>
            </div>
          </DialogContent>
          <DialogActions><Button appearance="primary" onClick={onClose}>Close</Button></DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
