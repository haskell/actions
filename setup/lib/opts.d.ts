export declare const release_revisions: Revisions;
export declare const supported_versions: Record<Tool, string[]>;
export declare const ghcup_version: string;
export declare type Revisions = Record<OS, Record<Tool, Array<{
    from: string;
    to: string;
}>>>;
export declare type OS = 'linux' | 'darwin' | 'win32';
export declare type Tool = 'cabal' | 'ghc' | 'stack';
export interface ProgramOpt {
    enable: boolean;
    raw: string;
    resolved: string;
}
export interface Options {
    ghc: ProgramOpt;
    cabal: ProgramOpt;
    stack: ProgramOpt & {
        setup: boolean;
    };
    general: {
        matcher: {
            enable: boolean;
        };
    };
}
declare type Version = {
    version: string;
    supported: string[];
};
export declare type Defaults = Record<Tool, Version> & {
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
export declare function getOpts({ ghc, cabal, stack }: Defaults, os: OS, inputs: Record<string, string>): Options;
export {};
