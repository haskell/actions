export type Severity
  = 'error'
  | 'warning'
  ;

export interface ProblemPattern {
  // The regex pattern that provides the groups to match against **required**
  regexp: string,
  // A group number containing the file name
  file?: number,
  // A group number containing a filepath used to root the file (e.g. a project file)
  fromPath?: number,
  // A group number containing the line number
  line?: number,
  // A group number containing the column information
  column?: number,
  // A group number containing either 'warning' or 'error' case-insensitive. Defaults to `error`
  severity?: number,
  // A group number containing the error code
  code?: number,
  // A group number containing the error message. **required** at least one pattern must set the message
  message: number,
  // Whether to loop until a match is not found, only valid on the last pattern of a multipattern matcher
  // NOTE: If there is only one matcher, this will error with:
  //  Only the last pattern in a multiline matcher may set 'loop'
  loop?: boolean,
}

export interface ProblemMatcher {
  // An ID field that can be used to remove or replace the problem matcher. **required**
  owner: string,

  // Indicates the default severity, either 'warning' or 'error' case-insensitive. Defaults to 'error'
  severity?: Severity,
  pattern: ProblemPattern[],
}

export interface ProblemMatcherDocument {
  problemMatcher: ProblemMatcher[],
}

// An object representing information that a "problemMatcher" can match on.
export type Problem = {
  file?: string,
  fromPath?: string,
  line?: number,
  column?: number,
  severity?: Severity,
  code?: string,
  message: string,
};

type MatchLineKey = keyof Problem

export const MATCH_LINE_KEYS: MatchLineKey[] = [
  'file',
  'fromPath',
  'line',
  'column',
  'severity',
  'code',
  'message',
];

// Constructs a string matching the problem matcher format defined in .github/hlint.json
function getSerializedProblem(toolName: string, prob: Problem): string {
  const fields = MATCH_LINE_KEYS
    .map(key => prob[key])
    .map(field => String(field || '').replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' '))
    .join('\t');
  return `${toolName}\t${fields}`;
}

// Construct the regex that can deconstruct the fields
function getMatchLineRegexString(toolName: string): string {
  return [
    `^${toolName}\\t`,
    ...(
      MATCH_LINE_KEYS
      .map(key => `(?<${key}>[^\\t]*)`)
      .join('\\t')
    ),
    '$',
  ].join('');
}

// Mapping each field name to the corresponding regex group number
type MatcherGroups = Record<keyof Problem, number>
const MATCH_LINE_REGEX_GROUPS: MatcherGroups = (
  MATCH_LINE_KEYS
  .map((key, index) => ([key, index + 1]))
  .reduce((obj, [key, matchGroup]) => ({...obj, [key]: matchGroup}), {} as MatcherGroups)
);

function getMatcherPatternObj(toolName: string): ProblemPattern {
  return {
    regexp: getMatchLineRegexString(toolName),
    ...MATCH_LINE_REGEX_GROUPS,
  };
}

function getMatcherDef(toolName: string): ProblemMatcherDocument {
  return {
    problemMatcher: [{
      owner: toolName,
      pattern: [getMatcherPatternObj(toolName)],
    }],
  };
}

export class SingleLineMatcherFormat {
  toolName: string;

  constructor(toolName: string) {
    this.toolName = toolName;
  }

  get definition(): ProblemMatcherDocument {
    return getMatcherDef(this.toolName);
  }

  serialize(problem: Problem): string {
    return getSerializedProblem(this.toolName, problem);
  }
}
