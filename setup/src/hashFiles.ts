// Copied from https://github.com/actions/runner/blob/master/src/Misc/expressionFunc/hashFiles/src/hashFiles.ts
// TODO: replace with @actions/cache::hashFiles when exposed in actions/toolkit
import * as glob from '@actions/glob';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as stream from 'stream';
import * as util from 'util';
import * as path from 'path';

export default async function hashFiles(
  patterns: string,
  followSymbolicLinks = true
): Promise<string> {
  const matchPatterns = patterns || '';
  console.log(`Match Pattern: ${matchPatterns}`);
  let hasMatch = false;
  const githubWorkspace = process.cwd();
  const result = crypto.createHash('sha256');
  const globber = await glob.create(matchPatterns, {followSymbolicLinks});
  for await (const file of globber.globGenerator()) {
    console.log(file);
    if (!file.startsWith(`${githubWorkspace}${path.sep}`)) {
      console.log(`Ignore '${file}' since it is not under GITHUB_WORKSPACE.`);
      continue;
    }
    if (fs.statSync(file).isDirectory()) {
      console.log(`Skip directory '${file}'.`);
      continue;
    }
    const hash = crypto.createHash('sha256');
    const pipeline = util.promisify(stream.pipeline);
    await pipeline(fs.createReadStream(file), hash);
    result.write(hash.digest());
    if (!hasMatch) {
      hasMatch = true;
    }
  }
  result.end();
  return result.digest('hex');
}
