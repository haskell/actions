import * as core from '@actions/core'
import type {
  RunResult,
} from './run';


const OUTPUT_KEY_HLINT_IDEAS = 'ideas';

export default function setOutputs(result: RunResult) {
  const {ok, ideas, statusCode, hintSummary} = result;
  core.setOutput(OUTPUT_KEY_HLINT_IDEAS, ideas);
  if (ok) {
    if (hintSummary.length) {
      core.info(`HLint finished with hints: ${hintSummary}`);
    } else {
      core.info('HLint finished');
    }
  } else {
    core.setFailed(`HLint failed with status: ${statusCode}. ${hintSummary}`);
  }
}
