import * as path from 'path';
import {
  Severity as GitHubSeverity,
  Problem as GitHubProblem,
  SingleLineMatcherFormat,
} from '../github';

export type Severity
  = 'Error'
  | 'Warning'
  | 'Suggestion'
  | 'Ignore'
  ;

export const SEVERITY_LEVELS = ['Error', 'Warning', 'Suggestion', 'Ignore'] as const;

/**
 * An idea suggested by an hlint 'Hint'.
 *
 * Derived from `src/Idea.hs` in the hlint source code: ndmitchell/hlint@v3.1.6
 */
export interface Idea {
  /**
   * The modules the idea is for, usually a singleton.
   */
  module: string[],
  /**
   * The declarations the idea is for, usually a singleton, typically the function name, but may be a type name.
   */
  decl: string[],
  /**
   * The severity of the idea, e.g. 'Warning'.
   */
  severity: Severity,
  /**
   * The name of the hint that generated the idea, e.g. @\"Use reverse\"@.
   */
  hint: string,
  /**
   * The source code filename the idea relates to.
   */
  file: string,
  /**
   * The start line in the source code the idea relates to.
   */
  startLine: number,
  /**
   * The start column of the source code the idea relates to.
   */
  startColumn: number,
  /**
   * The end line in the source code the idea relates to.
   */
  endLine: number,
  /**
   * The end column of the source code the idea relates to.
   */
  endColumn: number,
  /**
   * The contents of the source code the idea relates to.
   */
  from: string,
  /**
   * The suggested replacement, or 'Nothing' for no replacement (e.g. on parse errors).
   */
  to?: string,
  /**
   * Notes about the effect of applying the replacement.
   */
  note: string[],
  /**
   * How to perform this idea.
   */
  refactorings: string,
}

const HLINT_SEV_TO_GITHUB_SEV: Record<Severity, GitHubSeverity> = {
  Error: 'error',
  Warning: 'warning',
  Suggestion: 'warning',
  Ignore: 'warning',
};

/**
 * Use JSON escaping to turn messages with newlines and such into a single line.
 */
function escapeString(str: string, quote: boolean): string {
  const jsonEscaped = JSON.stringify(str).replace(/\n/g, ' ');
  // Possibly drop the surrounding quotes
  return quote ? jsonEscaped : jsonEscaped.slice(1, jsonEscaped.length - 1);
}

/**
 * Combine the non-"poblemMatcher" fields of an "idea" into
 * a single line as a human-readable message.
 *
 * Fields are visually separated by a box character (' ▫︎ ').
 */
function getNiceMessage(idea: Idea): string {
  const prefixParts = [];
  prefixParts.push(idea.severity);
  if (idea.decl && idea.decl.length) {
    prefixParts.push(`in ${idea.decl.join(', ')}`);
  }
  if (idea.module && idea.module.length) {
    prefixParts.push(`in module ${idea.module.join('.')}`);
  }
  const prefix = prefixParts.join(' ');

  const messageParts = [];
  messageParts.push(idea.hint);

  if (idea.from) {
    messageParts.push(`Found: ${escapeString(idea.from, true)}`);
  }
  if (idea.to) {
    messageParts.push(`Perhaps: ${escapeString(idea.to, true)}`);
  }
  if (idea.note && idea.note.length) {
    messageParts.push(`Note: ${idea.note.map(n => escapeString(n, false)).join(' ')}`);
  }
  const message = messageParts.join(' ▫︎ ');
  return [prefix, message].filter(Boolean).join(': ');
}

function toMatchableProblem(idea: Idea): GitHubProblem {
  const {file, startLine: line, startColumn: column, hint: code, severity: hlintSev} = idea;
  return {
    file,
    line,
    column,
    severity: HLINT_SEV_TO_GITHUB_SEV[hlintSev],
    code,
    message: getNiceMessage(idea),
  };
}

export const MATCHER = new SingleLineMatcherFormat('hlint');

// NOTE: Because ncc compiles all the files, take not to use __dirname here.
// This path is relative to the repo root. (Possibly meaning cwd, but not necessarily).
export const MATCHER_DEF_PATH = path.join('.github', 'hlint.json');

export function serializeProblem(idea: Idea): string {
  return MATCHER.serialize(toMatchableProblem(idea));
}
