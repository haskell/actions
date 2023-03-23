import {
  getOpts,
  getDefaults,
  release_revisions,
  supported_versions
} from '../src/opts';
import type {OS, Tool} from '../src/opts';

const def = (os: OS) => getDefaults(os);
const latestVersions = {
  ghc: supported_versions.ghc[0],
  cabal: supported_versions.cabal[0],
  stack: supported_versions.stack[0]
};
const latestRevisions = (os: OS, version: string) => ({
  ghc: release_revisions?.[os]?.ghc?.find(v => v.from === version)?.to,
  cabal: release_revisions?.[os]?.cabal?.find(v => v.from === version)?.to,
  stack: release_revisions?.[os]?.stack?.find(v => v.from === version)?.to
});

const forAllOS = (fn: (t: OS) => any) =>
  (['win32', 'darwin', 'linux'] as const).forEach(fn);

const forAllTools = (fn: (t: Tool) => any) =>
  (['ghc', 'cabal', 'stack'] as const).forEach(fn);

describe('haskell/actions/setup', () => {
  it('Parses action.yml to get correct default versions', () => {
    forAllOS(os =>
      forAllTools(t =>
        expect(def(os)[t].version).toBe(
          // Andreas, 2023-03-23: getDefaults actually does not return revision (like cabal 3.10.1.1),
          // but version (like cabal 3.10.1.0)
          // WAS: latestRevisions(os, latestVersions[t])[t] ?? latestVersions[t]
          latestVersions[t]
        )
      )
    );
  });

  it('Supported versions are parsed from JSON correctly', () =>
    forAllOS(os =>
      forAllTools(t => expect(def(os)[t].supported).toBe(supported_versions[t]))
    ));

  it('Setting disable-matcher to true disables matcher', () => {
    forAllOS(os => {
      const options = getOpts(def(os), os, {
        'disable-matcher': 'true'
      });
      expect(options.general.matcher.enable).toBe(false);
    });
  });

  it('getOpts grabs default general settings correctly from environment', () => {
    forAllOS(os => {
      const options = getOpts(def(os), os, {});
      expect(options.general.matcher.enable).toBe(true);
    });
  });

  it('getOpts grabs defaults correctly from environment', () => {
    forAllOS(os => {
      const options = getOpts(def(os), os, {});
      forAllTools(t => expect(options[t].raw).toBe(def(os)[t].version));
    });
  });

  it('Versions resolve correctly', () => {
    const v = {ghc: '8.6.5', cabal: '2.4.1.0', stack: '2.1.3'};
    forAllOS(os => {
      const options = getOpts(def(os), os, {
        'enable-stack': 'true',
        'stack-version': '2.1',
        'ghc-version': '8.6',
        'cabal-version': '2.4'
      });
      forAllTools(t => expect(options[t].resolved).toBe(v[t]));
    });
  });

  it('"latest" Versions resolve correctly', () => {
    forAllOS(os => {
      const options = getOpts(def(os), os, {
        'enable-stack': 'true',
        'stack-version': 'latest',
        'ghc-version': 'latest',
        'cabal-version': 'latest'
      });
      forAllTools(t =>
        expect(options[t].resolved).toBe(
          // latestRevisions(os, latestVersions[t])[t] ?? latestVersions[t]
          latestVersions[t]
        )
      );
    });
  });

  it('Enabling stack does not disable GHC or Cabal', () => {
    forAllOS(os => {
      const {ghc, cabal, stack} = getOpts(def(os), os, {
        'enable-stack': 'true'
      });
      expect({
        ghc: ghc.enable,
        stack: stack.enable,
        cabal: cabal.enable
      }).toStrictEqual({ghc: true, cabal: true, stack: true});
    });
  });

  it('Resolves revisions correctly on Windows', () => {
    // Test the case where there is a revision in chocolatey
    expect(
      getOpts(def('win32'), 'win32', {'ghc-version': '8.10.2'}).ghc.resolved
    ).toBe('8.10.2'); // Andreas, 2022-12-29: revisions are handled locally in choco() now

    // Test the case where there is not a revision in chocolatey
    expect(
      getOpts(def('win32'), 'win32', {'ghc-version': '8.8.1'}).ghc.resolved
    ).toBe('8.8.1');
  });

  it('Enabling stack-no-global disables GHC and Cabal', () => {
    forAllOS(os => {
      const {ghc, cabal, stack} = getOpts(def(os), os, {
        'enable-stack': 'true',
        'stack-no-global': 'true'
      });
      expect({
        ghc: ghc.enable,
        cabal: cabal.enable,
        stack: stack.enable
      }).toStrictEqual({ghc: false, cabal: false, stack: true});
    });
  });

  it('Enabling stack-no-global without setting enable-stack errors', () => {
    forAllOS(os =>
      expect(() => getOpts(def(os), os, {'stack-no-global': 'true'})).toThrow()
    );
  });

  it('Enabling stack-setup-ghc without setting enable-stack errors', () => {
    forAllOS(os =>
      expect(() => getOpts(def(os), os, {'stack-setup-ghc': 'true'})).toThrow()
    );
  });
});
