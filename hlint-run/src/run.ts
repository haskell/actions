import * as core from '@actions/core'
import * as path from 'path'
import {
  Idea as HLintIdea,
  Severity as HLintSeverity,
  SEVERITY_LEVELS as HLINT_SEV_LEVELS,
  MATCHER_DEF_PATH,
  serializeProblem,
} from './hlint';
import bufferedExec from './util/bufferedExec';
import withMatcherAtPath from './util/withMatcherAtPath';

export type CheckMode = HLintSeverity | 'STATUS' | 'NEVER';

export interface RunArgs {
  baseDir: string,
  hlintCmd: string,
  pathList: string[],
  failOn: CheckMode,
};

export interface HLintResult {
  statusCode: number,
  ideas: HLintIdea[],
}

export interface CheckResult {
  ok: boolean,
  hintSummary: string,
}

export interface RunResult extends HLintResult, CheckResult {
}

async function runHLint(cmd: string, args: string[]): Promise<HLintResult> {
  // In order to make regexable output without e.g. tripping over quotes, we need to transform the lines.
  core.info(`Running ${cmd} ${args.join(' ')}`);
  const {stdout: hlintOutputStr, statusCode} = await bufferedExec(cmd, args);
  core.info(`hlint completed with status code ${statusCode}`);
  const ideas: HLintIdea[] = JSON.parse(hlintOutputStr);
  ideas.map(serializeProblem).forEach(line => console.log(line));
  return {ideas, statusCode};
}

function getOverallCheckResult(failOn: CheckMode, {ideas, statusCode}: HLintResult): CheckResult {
  const hintsBySev = HLINT_SEV_LEVELS.map(sev => ([sev, ideas.filter(hint => hint.severity === sev).length]));
  const hintSummary = hintsBySev
    .filter(([_sevName, numHints]) => +numHints > 0)
    .map(([sev, num]) => `${sev} (${num})`).join(', ');

  let ok: boolean;
  if (failOn === 'STATUS' && statusCode !== 0) {
    ok = false;
  } else if (failOn === 'STATUS' || failOn === 'NEVER') {
    ok = true;
  } else {
    // Check the number of hints at or below the selected level.
    // (Low index means high severity).
    // Note that the summary still shows all counts.
    const failedBySev = hintsBySev
      .slice(0, HLINT_SEV_LEVELS.indexOf(failOn) + 1)
      .filter(([_sevName, numHints]) => +numHints > 0);
    ok = failedBySev.length === 0;
  }

  return {ok, hintSummary}
}

export default async function run({baseDir, hlintCmd, pathList, failOn}: RunArgs): Promise<RunResult> {
  const hlintArgs = ['-j', '--json', '--', ...pathList]
  const matcherDefPath = path.join(baseDir, MATCHER_DEF_PATH);
  const {ideas, statusCode} = await withMatcherAtPath(matcherDefPath, () => runHLint(hlintCmd, hlintArgs));
  const {ok, hintSummary} = getOverallCheckResult(failOn, {ideas, statusCode});
  return {ok, statusCode, ideas, hintSummary};
}
