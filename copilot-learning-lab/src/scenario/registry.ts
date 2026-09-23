import { mainDocuments } from './main/documents';
import { practiceDocuments } from './practice/documents';
import type { DocSection, SampleDocument } from './types';

export const allDocuments: SampleDocument[] = [...mainDocuments, ...practiceDocuments];

export const getDoc = (id: string) => allDocuments.find((d) => d.id === id);

export interface ResolvedCitation {
  id: string;
  doc?: SampleDocument;
  section?: DocSection;
  /** Pseudo-sources such as the reviewed briefing carried into Cowork. */
  pseudo?: { title: string; subtitle: string; text: string };
}

/** Pseudo-source id for the briefing a learner carries into Cowork. */
export const BRIEF_SOURCE_ID = 'brief';

export function resolveCitation(id: string, briefText?: string, briefSubtitle?: string): ResolvedCitation {
  if (id === BRIEF_SOURCE_ID) {
    return {
      id,
      pseudo: {
        title: 'Programme briefing (reviewed)',
        subtitle: briefSubtitle ?? 'Copied from your agent conversation',
        text: briefText ?? 'The briefing is no longer available.',
      },
    };
  }
  for (const doc of allDocuments) {
    const section = doc.sections.find((s) => s.id === id);
    if (section) return { id, doc, section };
  }
  return { id };
}

/** Rows of a table section, or [] if missing. */
export function tableRows(docId: string, sectionId: string): string[][] {
  const s = getDoc(docId)?.sections.find((x) => x.id === sectionId);
  return s?.table?.rows ?? [];
}

export function sectionText(docId: string, sectionId: string): string {
  return getDoc(docId)?.sections.find((x) => x.id === sectionId)?.text ?? '';
}
