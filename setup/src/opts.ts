import * as core from '@actions/core';
import {readFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {join} from 'path';
import * as supported_versions from './versions.json';
import * as rv from './release-revisions.json';

const release_revisions = rv as Revisions;

export type Revisions = Record<
  OS,
  Record<Tool, Array<{from: string; to: string}>>
>;
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

export const yamlInputs: Record<string, {default: string}> = (safeLoad(
  readFileSync(join(__dirname, '..', 'action.yml'), 'utf8')
  // The action.yml file structure is statically known.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any).inputs;

export function getDefaults(os: OS): Defaults {
  const mkVersion = (v: string, vs: string[], t: Tool): Version => ({
    version: resolve(yamlInputs[v].default, vs, t, os),
    supported: vs
  });

  return {
    ghc: mkVersion('ghc-version', supported_versions.ghc, 'ghc'),
    cabal: mkVersion('cabal-version', supported_versions.cabal, 'cabal'),
    stack: mkVersion('stack-version', supported_versions.stack, 'stack')
  };
}

function resolve(
  version: string,
  supported: string[],
  tool: Tool,
  os: OS
): string {
  const resolved =
    version === 'latest'
      ? supported[0]
      : supported.find(v => v.startsWith(version)) ?? version;
  return (
    release_revisions?.[os]?.[tool]?.find(({from}) => from === resolved)?.to ??
    resolved
  );
}

export function getOpts(
  {ghc, cabal, stack}: Defaults,
  os: OS,
  inputs: Record<string, string>
): Options {
  core.debug(`Inputs are: ${JSON.stringify(inputs)}`);
  const stackNoGlobal = (inputs['stack-no-global'] || '') !== '';
  const stackSetupGhc = (inputs['stack-setup-ghc'] || '') !== '';
  const stackEnable = (inputs['enable-stack'] || '') !== '';
  core.debug(`${stackNoGlobal}/${stackSetupGhc}/${stackEnable}`);
  const verInpt = {
    ghc: inputs['ghc-version'] || ghc.version,
    cabal: inputs['cabal-version'] || cabal.version,
    stack: inputs['stack-version'] || stack.version
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
      resolved: resolve(verInpt.ghc, ghc.supported, 'ghc', os),
      enable: !stackNoGlobal
    },
    cabal: {
      raw: verInpt.cabal,
      resolved: resolve(verInpt.cabal, cabal.supported, 'cabal', os),
      enable: !stackNoGlobal
    },
    stack: {
      raw: verInpt.stack,
      resolved: resolve(verInpt.stack, stack.supported, 'stack', os),
      enable: stackEnable,
      setup: stackSetupGhc
    }
  };

  // eslint-disable-next-line github/array-foreach
  Object.values(opts)
    .filter(t => t.enable && t.raw !== t.resolved)
    .forEach(t => core.info(`Resolved ${t.raw} to ${t.resolved}`));

  core.debug(`Options are: ${JSON.stringify(opts)}`);
  return opts;
}
