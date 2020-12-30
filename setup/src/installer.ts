import * as core from '@actions/core';
import {exec as e} from '@actions/exec';
import {which} from '@actions/io';
import {create as glob} from '@actions/glob';
import * as tc from '@actions/tool-cache';
import {promises as fs} from 'fs';
import {join} from 'path';
import type {OS, Tool} from './opts';

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
    if (os === 'win32') {
      core.exportVariable('STACK_ROOT', 'C:\\sr');
      core.setOutput('stack-root', 'C:\\sr');
    } else {
      core.setOutput('stack-root', `${process.env.HOME}/.stack`);
    }
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

  core.warning(
    `${tool} ${version} was not found in the cache. It will be downloaded.\n` +
      `If this is unexpected, please check if version ${version} is pre-installed.\n` +
      `The list of pre-installed versions is available here: https://help.github.com/en/actions/reference/software-installed-on-github-hosted-runners\n` +
      `The above list follows a common haskell convention that ${policy}\n` +
      'If the list is outdated, please file an issue here: https://github.com/actions/virtual-environments\n' +
      'by using the appropriate tool request template: https://github.com/actions/virtual-environments/issues/new/choose'
  );
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
  const v = tool === 'cabal' ? version.slice(0, 3) : version;
  const aptPath = `/opt/${tool}/${v}/bin`;

  const chocoPath = getChocoPath(tool, version);

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
    const installedPath = await fs
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
    const installedPath = await fs
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
      await apt(tool, version);
      if (await isInstalled(tool, version, os)) return;
      await ghcup(tool, version, os);
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

async function stack(version: string, os: OS): Promise<void> {
  core.info(`Attempting to install stack ${version}`);
  const build = {
    linux: `linux-x86_64${version >= '2.3.1' ? '' : '-static'}`,
    darwin: 'osx-x86_64',
    win32: 'windows-x86_64'
  }[os];

  const url = `https://github.com/commercialhaskell/stack/releases/download/v${version}/stack-${version}-${build}.tar.gz`;
  const p = await tc.downloadTool(`${url}`).then(tc.extractTar);
  const [stackPath] = await glob(`${p}/stack*`, {
    implicitDescendants: false
  }).then(async g => g.glob());
  await tc.cacheDir(stackPath, 'stack', version);
}

async function apt(tool: Tool, version: string): Promise<void> {
  const toolName = tool === 'ghc' ? 'ghc' : 'cabal-install';
  const v = tool === 'cabal' ? version.slice(0, 3) : version;
  core.info(`Attempting to install ${toolName} ${v} using apt-get`);
  // Ignore the return code so we can fall back to ghcup
  await exec(`sudo -- sh -c "apt-get -y install ${toolName}-${v}"`);
}

async function choco(tool: Tool, version: string): Promise<void> {
  core.info(`Attempting to install ${tool} ${version} using chocolatey`);
  // Choco tries to invoke `add-path` command on earlier versions of ghc, which has been deprecated and fails the step, so disable command execution during this.
  console.log('::stop-commands::SetupHaskellStopCommands');
  await exec('powershell', [
    'choco',
    'install',
    tool,
    '--version',
    version,
    '-m',
    '--no-progress',
    '-r'
  ]);
  console.log('::SetupHaskellStopCommands::'); // Re-enable command execution
  // Add GHC to path automatically because it does not add until the end of the step and we check the path.
  if (tool == 'ghc') core.addPath(getChocoPath(tool, version));
}

async function ghcupBin(os: OS): Promise<string> {
  const v = '0.1.12';
  const cachedBin = tc.find('ghcup', v);
  if (cachedBin) return join(cachedBin, 'ghcup');

  const bin = await tc.downloadTool(
    `https://downloads.haskell.org/ghcup/${v}/x86_64-${
      os === 'darwin' ? 'apple-darwin' : 'linux'
    }-ghcup-${v}`
  );
  await fs.chmod(bin, 0o755);
  return join(await tc.cacheFile(bin, 'ghcup', 'ghcup', v), 'ghcup');
}

async function ghcup(tool: Tool, version: string, os: OS): Promise<void> {
  core.info(`Attempting to install ${tool} ${version} using ghcup`);
  const bin = await ghcupBin(os);
  const returnCode = await exec(bin, ['install', tool, version]);
  if (returnCode === 0) await exec(bin, ['set', tool, version]);
}

function getChocoPath(tool: Tool, version: string): string {
  // If chocolatey has a patch release for GHC, 'version' will be a.b.c.d
  // but GHC's version is still a.b.c and the chocolatey path contains both
  // (This is only valid for GHC. cabal-install has 4-segment versions)
  const ghcVersion = version.split('.').slice(0, 3).join('.');
  const chocoPath = join(
    `${process.env.ChocolateyInstall}`,
    'lib',
    `${tool}.${version}`,
    'tools',
    tool === 'ghc' ? `${tool}-${ghcVersion}` : `${tool}-${version}`, // choco trims the ghc version here
    tool === 'ghc' ? 'bin' : ''
  );
  return chocoPath;
}
