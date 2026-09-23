import { logEvent, mutate } from './store';

/** Open the citation panel. `context` distinguishes agent answers from Cowork outputs. */
export function openCitation(id: string, context: { taskId?: string; scenario?: string; pack?: string; silent?: boolean } = {}) {
  mutate((s) => {
    s.ui.citation = { id, taskId: context.taskId };
    if (context.silent) return;
    if (context.taskId) logEvent(s, 'artifact_source_opened', { id, taskId: context.taskId, scenario: context.scenario });
    else logEvent(s, 'citation_opened', { id, pack: context.pack });
  });
}

export const closeCitation = () => mutate((s) => { s.ui.citation = null; });

export function openPicker(purpose: 'agent' | 'chat' | 'cowork', targetId?: string) {
  mutate((s) => { s.ui.pickerOpen = { purpose, targetId }; });
}
export const closePicker = () => mutate((s) => { s.ui.pickerOpen = null; });

export function setDrawer(d: null | 'lesson' | 'facilitator' | 'info') {
  mutate((s) => { s.ui.drawer = s.ui.drawer === d ? null : d; });
}

export function logDownload(name: string) {
  mutate((s) => logEvent(s, 'download', { name }));
}

export function logPreview(docId: string) {
  mutate((s) => logEvent(s, 'source_previewed', { docId }));
}
