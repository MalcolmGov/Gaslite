/** Shared types for editable scenario fixtures. */

export type FileKind = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'txt';
export type Classification = 'General' | 'Internal' | 'Confidential' | 'Restricted';

export interface DocSection {
  /** Stable id used by citations, e.g. "trk38-risks". */
  id: string;
  heading: string;
  /** Plain text. Lines starting with "- " render as bullets. */
  text?: string;
  table?: { columns: string[]; rows: string[][] };
}

export interface SampleDocument {
  id: string;
  title: string;
  fileName: string;
  kind: FileKind;
  version: string;
  owner: string;
  /** ISO date (YYYY-MM-DD). */
  modified: string;
  location: string;
  classification: Classification;
  /** Whether the simulated learner can open it. */
  learnerAccess: 'granted' | 'denied';
  /** Groups (by id) that can open the file. "all" = everyone in the training tenant. */
  readableBy: string[] | 'all';
  /** Id of the document that replaces this one. */
  supersededBy?: string;
  /** Id of a document this is a duplicate of. */
  duplicateOf?: string;
  summary: string;
  sections: DocSection[];
  /** Shown when access is denied. */
  accessMessage?: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  title: string;
  initials: string;
}

export interface Group {
  id: string;
  name: string;
  email: string;
  description: string;
  memberIds: string[];
  /** Number of members shown in the UI (can exceed memberIds for cohorts). */
  memberCount: number;
}

export interface CalendarEvent {
  id: string;
  personId: string;
  title: string;
  /** Local SAST date-time strings, "YYYY-MM-DDTHH:mm". */
  start: string;
  end: string;
}
