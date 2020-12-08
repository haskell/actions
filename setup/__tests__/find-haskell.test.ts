import {getOpts, getDefaults, Tool} from '../src/opts';
import {getInput} from '@actions/core';
import * as supported_versions from '../src/versions.json';

const def = getDefaults();
const latestVersions = {
  ghc: supported_versions.ghc[0],
  cabal: supported_versions.cabal[0],
  stack: supported_versions.stack[0]
};

const mkName = (s: string): string =>
  `INPUT_${s.replace(/ /g, '_').toUpperCase()}`;

const setupEnv = (o: Record<string, unknown>): void =>
  Object.entries(o).forEach(([k, v]) => v && (process.env[mkName(k)] = `${v}`));

const forAll = (fn: (t: Tool) => any) =>
  (['ghc', 'cabal', 'stack'] as const).forEach(fn);

describe('haskell/actions/setup', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...OLD_ENV};
    delete process.env.NODE_ENV;
  });

  afterEach(() => (process.env = OLD_ENV));

  it('Parses action.yml to get correct default versions', () => {
    forAll(t => expect(def[t].version).toBe(latestVersions[t]));
  });

  it('Supported versions are parsed from JSON correctly', () =>
    forAll(t => expect(def[t].supported).toBe(supported_versions[t])));

  it('[meta] Setup Env works', () => {
    setupEnv({input: 'value'});
    const i = getInput('input');
    expect(i).toEqual('value');
  });

  it('getOpts grabs defaults correctly from environment', () => {
    setupEnv({});
    const options = getOpts(def);
    forAll(t => expect(options[t].raw).toBe(def[t].version));
  });

  it('Versions resolve correctly', () => {
    const v = {ghc: '8.6.5', cabal: '2.4.1.0', stack: '2.1.3'};
    setupEnv({
      'stack-version': '2.1',
      'ghc-version': '8.6',
      'cabal-version': '2.4'
    });
    const options = getOpts(def);
    forAll(t => expect(options[t].resolved).toBe(v[t]));
  });

  it('"latest" Versions resolve correctly', () => {
    setupEnv({
      'stack-version': 'latest',
      'ghc-version': 'latest',
      'cabal-version': 'latest'
    });
    const options = getOpts(def);
    forAll(t => expect(options[t].resolved).toBe(latestVersions[t]));
  });

  it('Enabling stack does not disable GHC or Cabal', () => {
    setupEnv({'enable-stack': 'true'});
    const {ghc, cabal, stack} = getOpts(def);
    expect({
      ghc: ghc.enable,
      stack: stack.enable,
      cabal: cabal.enable
    }).toStrictEqual({ghc: true, cabal: true, stack: true});
  });

  it('Enabling stack-no-global disables GHC and Cabal', () => {
    setupEnv({'enable-stack': 'true', 'stack-no-global': 'true'});
    const {ghc, cabal, stack} = getOpts(def);
    expect({
      ghc: ghc.enable,
      cabal: cabal.enable,
      stack: stack.enable
    }).toStrictEqual({ghc: false, cabal: false, stack: true});
  });

  it('Enabling stack-no-global without setting enable-stack errors', () => {
    setupEnv({'stack-no-global': 'true'});
    expect(() => getOpts(def)).toThrow();
  });

  it('Enabling stack-setup-ghc without setting enable-stack errors', () => {
    setupEnv({'stack-setup-ghc': 'true'});
    expect(() => getOpts(def)).toThrow();
  });
});
