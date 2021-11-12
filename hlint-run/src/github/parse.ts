import {
  Problem,
  Severity,
  ProblemPattern,
  ProblemMatcherDocument,
  MATCH_LINE_KEYS,
} from './core';

// Parses the line-by-line output we've serialized.
// This is *just* for validating the matcher JSON regexes.

const parseInt = (str: string): number => {
  const num = Number.parseInt(str);
  if (!Number.isSafeInteger(num)) {
    throw new Error(`Bad integer: ${str}`);
  }
  return num;
};

const parseSeverity = (str: string): Severity => {
  if (str !== 'error' && str !== 'warning') {
    throw new Error(`Bad severity: ${str}`);
  }
  return str;
};

const parseNullableString = (str: string): string | undefined => str || undefined;

type FieldParser<K extends keyof Problem> = (_: string) => Problem[K];
type FieldParserSet = {
  readonly [K in keyof Required<Problem>]: FieldParser<K>
};

const PROBLEM_FIELD_PARSERS: FieldParserSet = {
  file: String,
  fromPath: parseNullableString,
  line: parseInt,
  column: parseInt,
  severity: parseSeverity,
  code: parseNullableString,
  message: String,
};

export function parseFormattedProblem(def: ProblemMatcherDocument, line: string): Problem {
  const defaultSeverity = def.problemMatcher[0].severity;
  const pattern: ProblemPattern = def.problemMatcher[0].pattern[0];
  const re = RegExp(pattern.regexp);
  const matchMb = re.exec(line);
  if (matchMb == null) {
    throw new Error(`RegExp (${pattern.regexp}) did not match line (${line})`);
  }
  const match = matchMb;

  function parseKey<K extends keyof Required<Problem>>(k: K): Problem[K] | undefined {
    const groupNum = pattern[k];
    if (groupNum == null || typeof groupNum !== 'number') {
      return;
    }
    const matchVal = match[groupNum];
    if (matchVal == null) {
      return;
    }
    // https://github.com/microsoft/TypeScript/issues/29225#issuecomment-451678927
    // > […] type parameters constrained to other type parameters, where we could deduce
    // > that they are always related, but we currently don't reason about those.
    // @ts-ignore
    const parser: FieldParser<K> = PROBLEM_FIELD_PARSERS[k];
    return parser(matchVal);
  }
  const prob = MATCH_LINE_KEYS
    .reduce((obj, k) => {
      const v = parseKey(k);
      return v == null ? obj : {...obj, [k]: v};
    }, {} as Problem);
  return {
    ...prob,
    severity: prob.severity || defaultSeverity,
  };
}
