import * as core from '@actions/core';
import {getOpts, getDefaults} from './installer';
import {exec} from '@actions/exec';

(async () => {
  try {
    const opts = getOpts(getDefaults());
    core.info('Preparing to setup a Haskell environment');
    core.debug(`Options are: ${JSON.stringify(opts)}`);

    for (const [tool, o] of Object.entries(opts)) {
      if (o.enable) {
        core.info(`Installing ${tool} version ${o.version}`);
        await o.install(o.version);
      }
    }

    if (opts.stack.setup) {
      core.startGroup('Pre-installing GHC with stack');
      await exec('stack', ['setup', opts.ghc.version]);
      core.endGroup();
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
