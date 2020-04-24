import * as core from '@actions/core';
import {readFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {join} from 'path';
import * as supported_versions from './versions.json';

export type OS = 'linux' | 'darwin' | 'win32';
export type Tool = 'cabal' | 'ghc' | 'stack';

export interface ProgramOpt {
  enable: boolean;
  raw: string;
  resolved: string;
}

export interface Options {
  ghc: ProgramOpt;
  cabal: ProgramOpt;
  stack: ProgramOpt & {setup: boolean};
}

type Version = {version: string; supported: string[]};
export type Defaults = Record<Tool, Version>;

export function getDefaults(): Defaults {
  const inpts = safeLoad(
    readFileSync(join(__dirname, '..', 'action.yml'), 'utf8')
  ).inputs;

  const mkVersion = (v: string, vs: string[]): Version => ({
    version: resolve(inpts[v].default, vs),
    supported: vs
  });

  return {
    ghc: mkVersion('ghc-version', supported_versions.ghc),
    cabal: mkVersion('cabal-version', supported_versions.cabal),
    stack: mkVersion('stack-version', supported_versions.stack)
  };
}

function resolve(version: string, supported: string[]): string {
  return version === 'latest'
    ? supported[0]
    : supported.find(v => v.startsWith(version)) ?? version;
}

export function getOpts({ghc, cabal, stack}: Defaults): Options {
  const stackNoGlobal = core.getInput('stack-no-global') !== '';
  const stackSetupGhc = core.getInput('stack-setup-ghc') !== '';
  const stackEnable = core.getInput('enable-stack') !== '';
  const verInpt = {
    ghc: core.getInput('ghc-version') || ghc.version,
    cabal: core.getInput('cabal-version') || cabal.version,
    stack: core.getInput('stack-version') || stack.version
  };

  const errors = [];
  if (stackNoGlobal && !stackEnable) {
    errors.push('enable-stack is required if stack-no-global is set');
  }

  if (stackSetupGhc && !stackEnable) {
    errors.push('enable-stack is required if stack-setup-ghc is set');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  const opts: Options = {
    ghc: {
      raw: verInpt.ghc,
      resolved: resolve(verInpt.ghc, ghc.supported),
      enable: !stackNoGlobal
    },
    cabal: {
      raw: verInpt.cabal,
      resolved: resolve(verInpt.cabal, cabal.supported),
      enable: !stackNoGlobal
    },
    stack: {
      raw: verInpt.stack,
      resolved: resolve(verInpt.stack, stack.supported),
      enable: stackEnable,
      setup: core.getInput('stack-setup-ghc') !== ''
    }
  };

  // eslint-disable-next-line github/array-foreach
  Object.values(opts)
    .filter(t => t.enable && t.raw !== t.resolved)
    .forEach(t => core.info(`Resolved ${t.raw} to ${t.resolved}`));

  core.debug(`Options are: ${JSON.stringify(opts)}`);
  return opts;
}
