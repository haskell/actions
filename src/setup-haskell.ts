import * as core from '@actions/core';
import {getOpts, getDefaults, Tool} from './opts';
import {installTool} from './installer';
import type {OS} from './opts';
import {exec} from '@actions/exec';

(async () => {
  try {
    core.info('Preparing to setup a Haskell environment');
    const opts = getOpts(getDefaults());

    for (const [t, {resolved}] of Object.entries(opts).filter(o => o[1].enable))
      await core.group(`Installing ${t} version ${resolved}`, async () =>
        installTool(t as Tool, resolved, process.platform as OS)
      );

    if (opts.stack.setup)
      await core.group('Pre-installing GHC with stack', async () =>
        exec('stack', ['setup', opts.ghc.resolved])
      );

    if (opts.cabal.enable)
      await core.group('Setting up cabal', async () => {
        await exec(
          'cabal user-config update -a "http-transport: plain-http" -v3'
        );
        await exec('cabal', ['update']);
        if (process.platform === 'win32') {
          await exec('cabal user-config update -a "store-dir: C:\\sr" -v3');
          core.setOutput('cabal-store', 'C:\\sr');
        } else {
          core.setOutput('cabal-store', `${process.env.HOME}/.cabal/store`);
        }
      });
  } catch (error) {
    core.setFailed(error.message);
  }
})();
