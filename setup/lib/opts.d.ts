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
export declare const yamlInputs: Record<string, {
    default: string;
}>;
export declare function getDefaults(os: OS): Defaults;
export declare function releaseRevision(version: string, tool: Tool, os: OS): string;
export declare function getOpts({ ghc, cabal, stack }: Defaults, os: OS, inputs: Record<string, string>): Options;
export {};
