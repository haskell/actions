import * as core from '@actions/core';
import {exec as e} from '@actions/exec';
import {which} from '@actions/io';
import * as tc from '@actions/tool-cache';
import {promises as afs} from 'fs';
import {join} from 'path';
import {ghcup_version, OS, Tool} from './opts';
import process from 'process';
import * as glob from '@actions/glob';
import {compareVersions} from 'compare-versions'; // compareVersions can be used in the sense of >

// Don't throw on non-zero.
const exec = async (cmd: string, args?: string[]): Promise<number> =>
  e(cmd, args, {ignoreReturnCode: true});

function failed(tool: Tool, version: string): void {
  throw new Error(`All install methods for ${tool} ${version} failed`);
}

async function configureOutputs(
  tool: Tool,
  path: string,
  os: OS
): Promise<void> {
  core.setOutput(`${tool}-path`, path);
  core.setOutput(`${tool}-exe`, await which(tool));
  if (tool == 'stack') {
    const sr =
      process.env['STACK_ROOT'] ??
      (os === 'win32' ? 'C:\\sr' : `${process.env.HOME}/.stack`);
    core.setOutput('stack-root', sr);
    if (os === 'win32') core.exportVariable('STACK_ROOT', sr);
  }
}

async function success(
  tool: Tool,
  version: string,
  path: string,
  os: OS
): Promise<true> {
  core.addPath(path);
  await configureOutputs(tool, path, os);
  core.info(
    `Found ${tool} ${version} in cache at path ${path}. Setup successful.`
  );
  return true;
}

function warn(tool: Tool, version: string): void {
  const policy = {
    cabal: `the two latest major releases of ${tool} are commonly supported.`,
    ghc: `the three latest major releases of ${tool} are commonly supported.`,
    stack: `the latest release of ${tool} is commonly supported.`
  }[tool];

  core.debug(
    `${tool} ${version} was not found in the cache. It will be downloaded.\n` +
      `If this is unexpected, please check if version ${version} is pre-installed.\n` +
      `The list of pre-installed versions is available here: https://help.github.com/en/actions/reference/software-installed-on-github-hosted-runners\n` +
      `The above list follows a common haskell convention that ${policy}\n` +
      'If the list is outdated, please file an issue here: https://github.com/actions/virtual-environments\n' +
      'by using the appropriate tool request template: https://github.com/actions/virtual-environments/issues/new/choose'
  );
}

function aptVersion(tool: string, version: string): string {
  // For Cabal, extract the first two segments of the version number. This
  // regex is intentionally liberal to accomodate unusual cases like "head".
  return tool === 'cabal' ? /[^.]*\.?[^.]*/.exec(version)![0] : version;
}

async function isInstalled(
  tool: Tool,
  version: string,
  os: OS
): Promise<boolean> {
  const toolPath = tc.find(tool, version);
  if (toolPath) return success(tool, version, toolPath, os);

  let ghcupPath = `${process.env.HOME}/.ghcup${
    tool === 'ghc' ? `/ghc/${version}` : ''
  }/bin`;
  if (os === 'win32') {
    ghcupPath = 'C:/ghcup/bin';
  }
  const v = aptVersion(tool, version);
  const aptPath = `/opt/${tool}/${v}/bin`;

  const locations = {
    stack: [], // Always installed into the tool cache
    cabal: {
      win32: [ghcupPath],
      linux: [ghcupPath, aptPath],
      darwin: [ghcupPath]
    }[os],
    ghc: {
      win32: [ghcupPath],
      linux: [ghcupPath, aptPath],
      darwin: [ghcupPath]
    }[os]
  };
  core.info(`isInstalled ${tool} ${version} ${locations[tool]}`);
  const f = await exec(await ghcupBin(os), ['whereis', tool, version]);
  core.info(`isInstalled whereis ${f}`);

  for (const p of locations[tool]) {
    core.info(`Attempting to access tool ${tool} at location ${p}`);
    const installedPath = await afs
      .access(p)
      .then(() => p)
      .catch(() => undefined);

    if (installedPath == undefined) {
      core.info(`Failed to access tool ${tool} at location ${p}`);
    } else {
      core.info(`Succeeded accessing tool ${tool} at location ${p}`);
    }

    if (installedPath) {
      // Make sure that the correct ghc is used, even if ghcup has set a
      // default prior to this action being ran.
      core.info(`isInstalled installedPath: ${installedPath}`);
      if (installedPath === ghcupPath) {
        // If the result of this `ghcup set` is non-zero, the version we want
        // is probably not actually installed
        const ghcupSetResult = await exec(await ghcupBin(os), [
          'set',
          tool,
          version
        ]);
        if (ghcupSetResult == 0)
          return success(tool, version, installedPath, os);
      } else {
        const cabalPath = await afs
          .access(`${installedPath}/cabal-${version}`)
          .then(() => p)
          .catch(() => undefined);
        core.info(`isInstalled cabalPath ${cabalPath}`);
        if (cabalPath) {
          return success(tool, version, installedPath, os);
        }
      }
    }
  }

  return false;
}

export async function installTool(
  tool: Tool,
  version: string,
  os: OS
): Promise<void> {
  if (await isInstalled(tool, version, os)) return;
  warn(tool, version);

  if (tool === 'stack') {
    await stack(version, os);
    if (await isInstalled(tool, version, os)) return;
    return failed(tool, version);
  }

  switch (os) {
    case 'linux':
      if (tool === 'ghc' && version === 'head') {
        if (!(await aptBuildEssential())) break;

        await ghcupGHCHead();
        break;
      }
      if (tool === 'ghc' && compareVersions('8.3', version)) {
        // Andreas, 2022-12-09: The following errors out if we are not ubuntu-20.04.
        // Atm, I do not know how to check whether we are on ubuntu-20.04.
        // So, ignore the error.
        // if (!(await aptLibCurses5())) break;
        await aptLibNCurses5();
      }
      await ghcup(tool, version, os);
      if (await isInstalled(tool, version, os)) return;
      await apt(tool, version);
      break;
    case 'win32':
      await ghcup(tool, version, os);
      break;
    case 'darwin':
      await ghcup(tool, version, os);
      break;
  }

  if (await isInstalled(tool, version, os)) return;
  return failed(tool, version);
}

export async function resetTool(
  tool: Tool,
  _version: string,
  os: OS
): Promise<void> {
  if (tool === 'stack') {
    // We don't need to do anything here... yet
    // (Once we switch to utilizing ghcup for stack when possible, we can
    // remove this early return)
    return;
  }

  let bin = '';
  switch (os) {
    case 'linux':
      bin = await ghcupBin(os);
      await exec(bin, ['unset', tool]);
      return;
    case 'darwin':
      bin = await ghcupBin(os);
      await exec(bin, ['unset', tool]);
      return;
    case 'win32':
      // We don't need to do anything here... yet
      return;
  }
}

async function stack(version: string, os: OS): Promise<void> {
  core.info(`Attempting to install stack ${version}`);
  const build = {
    linux: `linux-x86_64${
      compareVersions(version, '2.3.1') >= 0 ? '' : '-static'
    }`,
    darwin: 'osx-x86_64',
    win32: 'windows-x86_64'
  }[os];

  const url = `https://github.com/commercialhaskell/stack/releases/download/v${version}/stack-${version}-${build}.tar.gz`;
  const p = await tc.downloadTool(`${url}`).then(tc.extractTar);
  const [stackPath] = await glob
    .create(`${p}/stack*`, {
      implicitDescendants: false
    })
    .then(async g => g.glob());
  await tc.cacheDir(stackPath, 'stack', version);
}

async function aptBuildEssential(): Promise<boolean> {
  core.info(`Installing build-essential using apt-get (for ghc-head)`);

  const returnCode = await exec(
    `sudo -- sh -c "apt-get update && apt-get -y install build-essential"`
  );
  return returnCode === 0;
}

async function aptLibNCurses5(): Promise<boolean> {
  core.info(
    `Installing libcurses5 and libtinfo5 using apt-get (for ghc < 8.3)`
  );

  const returnCode = await exec(
    `sudo -- sh -c "apt-get update && apt-get -y install libncurses5 libtinfo5"`
  );
  return returnCode === 0;
}

async function apt(tool: Tool, version: string): Promise<void> {
  const toolName = tool === 'ghc' ? 'ghc' : 'cabal-install';
  const v = aptVersion(tool, version);
  core.info(`Attempting to install ${toolName} ${v} using apt-get`);
  // Ignore the return code so we can fall back to ghcup
  await exec(
    `sudo -- sh -c "add-apt-repository -y ppa:hvr/ghc && apt-get update && apt-get -y install ${toolName}-${v}"`
  );
}

async function ghcupBin(os: OS): Promise<string> {
  core.info(`ghcupBin : ${os}`);
  if (os === 'win32') {
    return 'ghcup';
  }
  const cachedBin = tc.find('ghcup', ghcup_version);
  if (cachedBin) return join(cachedBin, 'ghcup');

  const bin = await tc.downloadTool(
    `https://downloads.haskell.org/ghcup/${ghcup_version}/x86_64-${
      os === 'darwin' ? 'apple-darwin' : 'linux'
    }-ghcup-${ghcup_version}`
  );
  await afs.chmod(bin, 0o755);
  return join(
    await tc.cacheFile(bin, 'ghcup', 'ghcup', ghcup_version),
    'ghcup'
  );
}

export async function addGhcupReleaseChannel(
  channel: URL,
  os: OS
): Promise<void> {
  core.info(`Adding ghcup release channel: ${channel}`);
  const bin = await ghcupBin(os);
  await exec(bin, ['config', 'add-release-channel', channel.toString()]);
}

async function ghcup(tool: Tool, version: string, os: OS): Promise<void> {
  core.info(`Attempting to install ${tool} ${version} using ghcup`);
  const bin = await ghcupBin(os);
  const returnCode = await exec(bin, ['install', tool, version]);
  if (returnCode === 0) await exec(bin, ['set', tool, version]);
}

async function ghcupGHCHead(): Promise<void> {
  core.info(`Attempting to install ghc head using ghcup`);
  const bin = await ghcupBin('linux');
  const returnCode = await exec(bin, [
    'install',
    'ghc',
    '-u',
    'https://gitlab.haskell.org/ghc/ghc/-/jobs/artifacts/master/raw/ghc-x86_64-deb9-linux-integer-simple.tar.xz?job=validate-x86_64-linux-deb9-integer-simple',
    'head'
  ]);
  if (returnCode === 0) await exec(bin, ['set', 'ghc', 'head']);
}
