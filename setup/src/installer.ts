import * as core from '@actions/core';
import {exec as e} from '@actions/exec';
import {which} from '@actions/io';
import * as tc from '@actions/tool-cache';
import {promises as afs} from 'fs';
import {join, dirname} from 'path';
import {ghcup_version, OS, Tool} from './opts';
import process from 'process';
import * as glob from '@actions/glob';
import * as fs from 'fs';
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

  const ghcupPath = `${process.env.HOME}/.ghcup${
    tool === 'ghc' ? `/ghc/${version}` : ''
  }/bin`;
  const v = aptVersion(tool, version);
  const aptPath = `/opt/${tool}/${v}/bin`;

  const chocoPath = await getChocoPath(tool, version);

  const locations = {
    stack: [], // Always installed into the tool cache
    cabal: {
      win32: [chocoPath],
      linux: [aptPath],
      darwin: []
    }[os],
    ghc: {
      win32: [chocoPath],
      linux: [aptPath, ghcupPath],
      darwin: [ghcupPath]
    }[os]
  };

  for (const p of locations[tool]) {
    const installedPath = await afs
      .access(p)
      .then(() => p)
      .catch(() => undefined);

    if (installedPath) {
      // Make sure that the correct ghc is used, even if ghcup has set a
      // default prior to this action being ran.
      if (tool === 'ghc' && installedPath === ghcupPath)
        await exec(await ghcupBin(os), ['set', tool, version]);

      return success(tool, version, installedPath, os);
    }
  }

  if (tool === 'cabal' && os !== 'win32') {
    const installedPath = await afs
      .access(`${ghcupPath}/cabal-${version}`)
      .then(() => ghcupPath)
      .catch(() => undefined);

    if (installedPath) {
      await exec(await ghcupBin(os), ['set', tool, version]);
      return success(tool, version, installedPath, os);
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
      await choco(tool, version);
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

async function choco(tool: Tool, version: string): Promise<void> {
  core.info(`Attempting to install ${tool} ${version} using chocolatey`);
  // Choco tries to invoke `add-path` command on earlier versions of ghc, which has been deprecated and fails the step, so disable command execution during this.
  console.log('::stop-commands::SetupHaskellStopCommands');
  const args = [
    'choco',
    'install',
    tool,
    '--version',
    version,
    '-m',
    '--no-progress',
    '-d' // WAS: -r (opposite)
  ];
  if ((await exec('powershell', args)) !== 0)
    await exec('powershell', [...args, '--pre']);
  console.log('::SetupHaskellStopCommands::'); // Re-enable command execution
  // Add GHC to path automatically because it does not add until the end of the step and we check the path.

  const chocoPath = await getChocoPath(tool, version);

  if (tool == 'ghc') core.addPath(chocoPath);
}

async function ghcupBin(os: OS): Promise<string> {
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

async function getChocoPath(tool: Tool, version: string): Promise<string> {
  // Environment variable 'ChocolateyToolsLocation' will be added to Hosted images soon
  // fallback to C:\\tools for now until variable is available
  const chocoToolsLocation =
    process.env.ChocolateyToolsLocation ??
    join(`${process.env.SystemDrive}`, 'tools');

  // choco packages GHC 9.x are installed on different path (C:\\tools\ghc-9.0.1)
  let chocoToolPath = join(chocoToolsLocation, `${tool}-${version}`);

  // choco packages GHC < 9.x
  if (!fs.existsSync(chocoToolPath)) {
    chocoToolPath = join(
      `${process.env.ChocolateyInstall}`,
      'lib',
      `${tool}.${version}`
    );
  }

  const pattern = `${chocoToolPath}/**/${tool}.exe`;
  const globber = await glob.create(pattern);

  for await (const file of globber.globGenerator()) {
    return dirname(file);
  }

  return '<not-found>';
}
