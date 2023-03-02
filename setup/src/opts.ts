import * as core from '@actions/core';
import {readFileSync} from 'fs';
import {load} from 'js-yaml';
import {join} from 'path';
import * as sv from './versions.json';
import * as rv from './release-revisions.json';

export const release_revisions = rv as Revisions;
export const supported_versions = sv as Record<Tool, string[]>;
export const ghcup_version = sv.ghcup[0]; // Known to be an array of length 1

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
  ghcup: {releaseChannel?: URL};
  cabal: ProgramOpt & {update: boolean};
  stack: ProgramOpt & {setup: boolean};
  general: {matcher: {enable: boolean}};
}

type Version = {version: string; supported: string[]};
export type Defaults = Record<Tool, Version> & {
  general: {matcher: {enable: boolean}};
};

/**
 * Reads the example `actions.yml` file and selects the `inputs` key. The result
 * will be a key-value map of the following shape:
 * ```
 * {
 *   'ghc-version': {
 *     required: false,
 *     description: '...',
 *     default: 'latest'
 *   },
 *   'cabal-version': {
 *     required: false,
 *     description: '...',
 *     default: 'latest'
 *   },
 *   'stack-version': {
 *     required: false,
 *     description: '...',
 *     default: 'latest'
 *   },
 *   'enable-stack': {
 *     required: false,
 *     default: 'latest'
 *   },
 *   ...
 * }
 * ```
 */
export const yamlInputs: Record<string, {default: string}> = (
  load(
    readFileSync(join(__dirname, '..', 'action.yml'), 'utf8')
    // The action.yml file structure is statically known.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any
).inputs;

export function getDefaults(os: OS): Defaults {
  const mkVersion = (v: string, vs: string[], t: Tool): Version => ({
    version: resolve(yamlInputs[v].default, vs, t, os, false), // verbose=false: no printout here
    supported: vs
  });

  return {
    ghc: mkVersion('ghc-version', supported_versions.ghc, 'ghc'),
    cabal: mkVersion('cabal-version', supported_versions.cabal, 'cabal'),
    stack: mkVersion('stack-version', supported_versions.stack, 'stack'),
    general: {matcher: {enable: true}}
  };
}

// E.g. resolve ghc latest to 9.4.2
function resolve(
  version: string,
  supported: string[],
  tool: Tool,
  os: OS,
  verbose: boolean // If resolution isn't the identity, print what resolved to what.
): string {
  const result =
    version === 'latest'
      ? supported[0]
      : supported.find(v => v.startsWith(version)) ?? version;
  // Andreas 2022-12-29, issue #144: inform about resolution here where we can also output ${tool}.
  if (verbose === true && version !== result)
    core.info(`Resolved ${tool} ${version} to ${result}`);
  return result;
}

// Further resolve the version to a revision using release-revisions.json.
// This is only needed for choco-installs (at time of writing, 2022-12-29).
export function releaseRevision(version: string, tool: Tool, os: OS): string {
  const result: string =
    release_revisions?.[os]?.[tool]?.find(({from}) => from === version)?.to ??
    version;
  return result;
}

/**
 * Convert a string input to a boolean according to the YAML 1.2 "core schema" specification.
 * Supported boolean renderings: `true | True | TRUE | false | False | FALSE` .
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 * Adapted from: https://github.com/actions/toolkit/commit/fbdf27470cdcb52f16755d32082f1fee0bfb7d6d#diff-f63fb32fca85d8e177d6400ce078818a4815b80ac7a3319b60d3507354890992R94-R115
 *
 * @param     name     name of the input
 * @param     val      supposed string representation of a boolean
 * @returns   boolean
 */
export function parseYAMLBoolean(name: string, val: string): boolean {
  const trueValue = ['true', 'True', 'TRUE'];
  const falseValue = ['false', 'False', 'FALSE'];
  if (trueValue.includes(val)) return true;
  if (falseValue.includes(val)) return false;
  throw new TypeError(
    `Action input "${name}" does not meet YAML 1.2 "Core Schema" specification: \n` +
      `Supported boolean values: \`true | True | TRUE | false | False | FALSE\``
  );
}

export function parseURL(name: string, val: string): URL | undefined {
  if (val === '') return undefined;
  try {
    return new URL(val);
  } catch (e) {
    throw new TypeError(`Action input "${name}" is not a valid URL`);
  }
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
  const matcherDisable = (inputs['disable-matcher'] || '') !== '';
  const ghcupReleaseChannel = parseURL(
    'ghcup-release-channel',
    inputs['ghcup-release-channel'] || ''
  );
  // Andreas, 2023-01-05, issue #29:
  // 'cabal-update' has a default value, so we should get a proper boolean always.
  // Andreas, 2023-01-06: This is not true if we use the action as a library.
  // Thus, need to patch with default value here.
  const cabalUpdate = parseYAMLBoolean(
    'cabal-update',
    inputs['cabal-update'] || 'true'
  );
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

  const ghcEnable = !stackNoGlobal;
  const cabalEnable = !stackNoGlobal;
  const opts: Options = {
    ghc: {
      raw: verInpt.ghc,
      resolved: resolve(
        verInpt.ghc,
        ghc.supported,
        'ghc',
        os,
        ghcEnable // if true: inform user about resolution
      ),
      enable: ghcEnable
    },
    ghcup: {
      releaseChannel: ghcupReleaseChannel
    },
    cabal: {
      raw: verInpt.cabal,
      resolved: resolve(
        verInpt.cabal,
        cabal.supported,
        'cabal',
        os,
        cabalEnable // if true: inform user about resolution
      ),
      enable: cabalEnable,
      update: cabalUpdate
    },
    stack: {
      raw: verInpt.stack,
      resolved: resolve(
        verInpt.stack,
        stack.supported,
        'stack',
        os,
        stackEnable // if true: inform user about resolution
      ),
      enable: stackEnable,
      setup: stackSetupGhc
    },
    general: {matcher: {enable: !matcherDisable}}
  };

  core.debug(`Options are: ${JSON.stringify(opts)}`);
  return opts;
}
