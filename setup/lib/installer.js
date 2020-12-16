'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          }
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', {enumerable: true, value: v});
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', {value: true});
exports.installTool = void 0;
const core = __importStar(require('@actions/core'));
const exec_1 = require('@actions/exec');
const io_1 = require('@actions/io');
const glob_1 = require('@actions/glob');
const tc = __importStar(require('@actions/tool-cache'));
const fs_1 = require('fs');
const path_1 = require('path');
// Don't throw on non-zero.
const exec = async (cmd, args) =>
  exec_1.exec(cmd, args, {ignoreReturnCode: true});
function failed(tool, version) {
  throw new Error(`All install methods for ${tool} ${version} failed`);
}
async function configureOutputs(tool, path, os) {
  core.setOutput(`${tool}-path`, path);
  core.setOutput(`${tool}-exe`, await io_1.which(tool));
  if (tool == 'stack') {
    if (os === 'win32') {
      core.exportVariable('STACK_ROOT', 'C:\\sr');
      core.setOutput('stack-root', 'C:\\sr');
    } else {
      core.setOutput('stack-root', `${process.env.HOME}/.stack`);
    }
  }
}
async function success(tool, version, path, os) {
  core.addPath(path);
  await configureOutputs(tool, path, os);
  core.info(
    `Found ${tool} ${version} in cache at path ${path}. Setup successful.`
  );
  return true;
}
function warn(tool, version) {
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
async function isInstalled(tool, version, os) {
  const toolPath = tc.find(tool, version);
  if (toolPath) return success(tool, version, toolPath, os);
  const ghcupPath = `${process.env.HOME}/.ghcup${
    tool === 'ghc' ? `/ghc/${version}` : ''
  }/bin`;
  const v = tool === 'cabal' ? version.slice(0, 3) : version;
  const aptPath = `/opt/${tool}/${v}/bin`;
  const chocoPath = getChocoPath(tool, version);
  const locations = {
    stack: [],
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
    const installedPath = await fs_1.promises
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
    const installedPath = await fs_1.promises
      .access(`${ghcupPath}/cabal`)
      .then(() => ghcupPath)
      .catch(() => undefined);
    if (installedPath) {
      await exec(await ghcupBin(os), ['set', tool, version]);
      return success(tool, version, installedPath, os);
    }
  }
  return false;
}
async function installTool(tool, version, os) {
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
exports.installTool = installTool;
async function stack(version, os) {
  core.info(`Attempting to install stack ${version}`);
  const build = {
    linux: `linux-x86_64${version >= '2.3.1' ? '' : '-static'}`,
    darwin: 'osx-x86_64',
    win32: 'windows-x86_64'
  }[os];
  const url = `https://github.com/commercialhaskell/stack/releases/download/v${version}/stack-${version}-${build}.tar.gz`;
  const p = await tc.downloadTool(`${url}`).then(tc.extractTar);
  const [stackPath] = await glob_1
    .create(`${p}/stack*`, {
      implicitDescendants: false
    })
    .then(async g => g.glob());
  await tc.cacheDir(stackPath, 'stack', version);
}
async function apt(tool, version) {
  const toolName = tool === 'ghc' ? 'ghc' : 'cabal-install';
  const v = tool === 'cabal' ? version.slice(0, 3) : version;
  core.info(`Attempting to install ${toolName} ${v} using apt-get`);
  // Ignore the return code so we can fall back to ghcup
  await exec(`sudo -- sh -c "apt-get -y install ${toolName}-${v}"`);
}
async function choco(tool, version) {
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
async function ghcupBin(os) {
  const v = '0.1.12';
  const cachedBin = tc.find('ghcup', v);
  if (cachedBin) return path_1.join(cachedBin, 'ghcup');
  const bin = await tc.downloadTool(
    `https://downloads.haskell.org/ghcup/${v}/x86_64-${
      os === 'darwin' ? 'apple-darwin' : 'linux'
    }-ghcup-${v}`
  );
  await fs_1.promises.chmod(bin, 0o755);
  return path_1.join(await tc.cacheFile(bin, 'ghcup', 'ghcup', v), 'ghcup');
}
async function ghcup(tool, version, os) {
  core.info(`Attempting to install ${tool} ${version} using ghcup`);
  const bin = await ghcupBin(os);
  const returnCode = await exec(bin, ['install', tool, version]);
  if (returnCode === 0) await exec(bin, ['set', tool, version]);
}
function getChocoPath(tool, version) {
  // If chocolatey has a patch release for GHC, 'version' will be a.b.c.d
  // but GHC's version is still a.b.c and the chocolatey path contains both
  // (This is only valid for GHC. cabal-install has 4-segment versions)
  const ghcVersion = version.split('.').slice(0, 3).join('.');
  const chocoPath = path_1.join(
    `${process.env.ChocolateyInstall}`,
    'lib',
    `${tool}.${version}`,
    'tools',
    tool === 'ghc' ? `${tool}-${ghcVersion}` : `${tool}-${version}`, // choco trims the ghc version here
    tool === 'ghc' ? 'bin' : ''
  );
  return chocoPath;
}
