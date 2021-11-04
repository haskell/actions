import * as core from '@actions/core'
import * as fs from 'fs';
import {promisify} from 'util';
import {ProblemMatcherDocument} from '../github';
import {issueCommand} from "@actions/core/lib/command"

const readFile = promisify(fs.readFile);

export async function addMatcherAtPath(matcherPath: string): Promise<ProblemMatcherDocument> {
  core.debug(`Adding problem matcher at ${matcherPath}`);
  // Reference:
  // https://github.com/actions/setup-node/blob/1ae8f4b1fd89676f69b55d3dd6932b6df089ff7b/src/main.ts
  // uses ##[add-matcher]some-path.json
  //
  // However, https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
  // says that commands are formatted `::some-command param1=…,param2=…`
  // and https://github.com/actions/toolkit/blob/1cc56db0ff126f4d65aeb83798852e02a2c180c3/docs/commands.md#problem-matchers
  // says to use `::add-matcher::some-path.json`
  //
  // From testing, both syntaxes are accepted.
  // console.log(`::add-matcher::${matcherPath}`);
  // console.log(`##[add-matcher]${matcherPath}`);
  //
  // Further, https://github.com/xt0rted/stylelint-problem-matcher/blob/07aaf5c97e07cd7e328337daf89964fcacbc5d00/src/main.ts
  // uses a utility `import { issueCommand } from "@actions/core/lib/command"`
  // to do this. That looks like the best choice for now.
  const fileContents = await readFile(matcherPath, 'utf8');
  const problemMatcherDocument: ProblemMatcherDocument = JSON.parse(fileContents);
  issueCommand('add-matcher', {}, matcherPath);
  return problemMatcherDocument;
}

export async function removeMatcher(problemMatcherDocument: ProblemMatcherDocument) {
  problemMatcherDocument.problemMatcher.forEach(({owner}) => {
    issueCommand('remove-matcher', {owner}, '');
  });
}

export default async function withMatcherAtPath<T>(matcherPath: string, fn: () => Promise<T>): Promise<T> {
  const matcherDoc: ProblemMatcherDocument | null = await ((async () => {
    try {
      // NOTE: Explicitly awaiting to make sure `catch` includes failed promise.
      return await addMatcherAtPath(matcherPath);
    } catch (e) {
      core.error(`Error adding problem matcher at path ${matcherPath}: ${e}`);
      return null;
    }
  })());

  try {
    // Explicitly awaiting to make sure `finally` runs after fn().
    return await fn();
  } finally {
    if (matcherDoc != null) {
      await removeMatcher(matcherDoc);
    }
  }
}
