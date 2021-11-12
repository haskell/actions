import * as core from '@actions/core'

import getInputs from './inputs';
import run from './run';
import setOutputs from './outputs';

export default async function main() {
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
