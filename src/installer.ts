import * as core from '@actions/core';
import {exec} from '@actions/exec';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import {promises as fs, readFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {join} from 'path';

export interface ProgramOpt {
  enable: boolean;
  version: string;
  install: (version: string) => Promise<void>;
}

export interface Options {
  ghc: ProgramOpt;
  cabal: ProgramOpt;
  stack: ProgramOpt & {setup: boolean};
}

export interface Defaults {
  ghc: {version: string};
  cabal: {version: string};
}

export function getDefaults(): Defaults {
  const actionYml = safeLoad(
    readFileSync(join(__dirname, '..', 'action.yml'), 'utf8')
  );
  return {
    ghc: {version: actionYml.inputs['ghc-version'].default},
    cabal: {version: actionYml.inputs['cabal-version'].default}
  };
}

export function getOpts(def: Defaults): Options {
  const stackNoGlobal = core.getInput('stack-no-global') !== '';
  const stackVersion = core.getInput('stack-version');
  const stackSetupGhc = core.getInput('stack-setup-ghc') !== '';

  const errors = [];
  if (stackNoGlobal && stackVersion === '') {
    errors.push('stack-version is required if stack-no-global is set');
  }

  if (stackSetupGhc && stackVersion === '') {
    errors.push('stack-version is required if stack-setup-ghc is set');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return {
    ghc: {
      version: core.getInput('ghc-version') || def.ghc.version,
      enable: !stackNoGlobal,
      install: installGHC
    },
    cabal: {
      version: core.getInput('cabal-version') || def.cabal.version,
      enable: !stackNoGlobal,
      install: installCabal
    },
    stack: {
      version: stackVersion,
      enable: stackVersion !== '',
      install: installStack,
      setup: core.getInput('stack-setup-ghc') !== ''
    }
  };
}

export const installCabal = async (version: string): Promise<void> =>
  installTool('cabal', version);

export const installGHC = async (version: string): Promise<void> =>
  installTool('ghc', version);

export async function installStack(version: string): Promise<void> {
  const info =
    version === 'latest'
      ? 'Installing the latest version'
      : `Installing version ${version}`;
  core.startGroup(`${info} of stack`);
  const platformMap = ({
    linux: 'linux-x86_64-static',
    darwin: 'osx-x86_64',
    win32: 'windows-x86_64'
  } as unknown) as Record<NodeJS.Platform, string>;

  const name = `stack-${version}-${platformMap[process.platform]}`;
  const url =
    version === 'latest'
      ? `get.haskellstack.org/stable/${platformMap[process.platform]}`
      : `github.com/commercialhaskell/stack/releases/download/v${version}/${name}`;

  const stack = await tc.downloadTool(`https://${url}.tar.gz`);
  const p = await tc.extractTar(stack);

  // Less janky than figuring out how to ./p/*/stack. (Not by much)
  const stackPath =
    (await fs.readdir(p, {withFileTypes: true}))
      .flatMap(d => (d.isDirectory() ? [d.name] : []))
      .find(f => f.startsWith('stack')) ?? '';

  const cachedTool = await tc.cacheDir(join(p, stackPath), 'stack', version);
  core.addPath(cachedTool);

  core.endGroup();
}

type Tool = 'cabal' | 'ghc';
async function installTool(tool: Tool, version: string): Promise<void> {
  core.startGroup(`Installing ${tool}`);
  // Currently only linux comes pre-installed with some versions of GHC.
  // They're intalled to /opt. Let's see if we can save ourselves a download
  if (process.platform === 'linux') {
    // Cabal is installed to /opt/cabal/x.x but cabal's full version is X.X.Y.Z
    const v = tool === 'cabal' ? version.slice(0, 3) : version;
    try {
      const p = join('/opt', tool, v, 'bin');
      await fs.access(p);
      core.debug(`Using pre-installed ${tool} ${version}`);
      core.addPath(p);
      core.endGroup();
      return;
    } catch {
      // oh well, we tried
    }
  }

  if (process.platform === 'win32') {
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

    core.addPath(
      join(
        process.env.ChocolateyInstall || '',
        'lib',
        `${tool}.${version}`,
        'tools',
        `${tool}-${version}`,
        tool === 'ghc' ? 'bin' : ''
      )
    );
  } else {
    const ghcup = await tc.downloadTool(
      'https://raw.githubusercontent.com/haskell/ghcup/master/ghcup'
    );
    await fs.chmod(ghcup, 0o755);
    await io.mkdirP(join(process.env.HOME || '', '.ghcup', 'bin'));
    await exec(ghcup, [tool === 'ghc' ? 'install' : 'install-cabal', version]);

    const p = tool === 'ghc' ? ['ghc', version] : [];
    core.addPath(join(process.env.HOME || '', '.ghcup', ...p, 'bin'));
  }
  core.endGroup();
}
