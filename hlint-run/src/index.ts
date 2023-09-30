import * as core from '@actions/core'

import getInputs from './inputs';
import run from './run';
import setOutputs from './outputs';

export default async function main() {
  core.warning(
    'As of 2023-09-30, haskell/action/hlint-run is no longer maintained, please switch to haskell-actions/hlint-run (note: dash for slash).'
  );
  core.info(
    `***************************************************************************`
  );
  core.info(
    `**                                                                       **`
  );
  core.info(
    `**              This action is DEPRECATED.                               **`
  );
  core.info(
    `**                                                                       **`
  );
  core.info(
    `**              Please use haskell-actions/hlint-run instead.            **`
  );
  core.info(
    `**                                                                       **`
  );
  core.info(
    `**              (Note the dash instead of the slash.)                    **`
  );
  core.info(
    `**                                                                       **`
  );
  core.info(
    `***************************************************************************`
  );
  try {
    const inputs = getInputs();
    const result = await core.group('hlint', () => run(inputs));
    setOutputs(result);
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
  }
}

if (require.main === module) {
  main();
}
