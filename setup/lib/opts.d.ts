/// <reference types="node" />
export declare const release_revisions: Revisions;
export declare const supported_versions: Record<Tool, string[]>;
export declare const ghcup_version: string;
export type Revisions = Record<OS, Record<Tool, Array<{
    from: string;
    to: string;
}>>>;
export type OS = 'linux' | 'darwin' | 'win32';
export type Tool = 'cabal' | 'ghc' | 'stack';
export interface ProgramOpt {
    enable: boolean;
    raw: string;
    resolved: string;
}
export interface Options {
    ghc: ProgramOpt;
    ghcup: {
        releaseChannel?: URL;
    };
    cabal: ProgramOpt & {
        update: boolean;
    };
    stack: ProgramOpt & {
        setup: boolean;
    };
    general: {
        matcher: {
            enable: boolean;
        };
    };
}
type Version = {
    version: string;
    supported: string[];
};
export type Defaults = Record<Tool, Version> & {
    general: {
        matcher: {
            enable: boolean;
        };
    };
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
export declare const yamlInputs: Record<string, {
    default: string;
}>;
export declare function getDefaults(os: OS): Defaults;
export declare function releaseRevision(version: string, tool: Tool, os: OS): string;
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
export declare function parseYAMLBoolean(name: string, val: string): boolean;
export declare function parseURL(name: string, val: string): URL | undefined;
export declare function getOpts({ ghc, cabal, stack }: Defaults, os: OS, inputs: Record<string, string>): Options;
export {};
