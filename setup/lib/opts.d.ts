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
}
declare type Version = {
    version: string;
    supported: string[];
};
export declare type Defaults = Record<Tool, Version>;
export declare const yamlInputs: Record<string, {
    default: string;
}>;
export declare function getDefaults(os: OS): Defaults;
export declare function getOpts({ ghc, cabal, stack }: Defaults, os: OS, inputs: Record<string, string>): Options;
export {};
