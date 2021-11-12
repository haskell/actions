import * as core from '@actions/core'
import * as path from 'path'
import {
  SEVERITY_LEVELS as HLINT_SEV_LEVELS,
} from './hlint';
import type {
  CheckMode,
  RunArgs,
} from './run';

function parseStringOrJsonArray(rawInput: string): string[] {
  if (/^\s*\[.*\]\s*$/.test(rawInput)) {
    const array = JSON.parse(rawInput);
    if (!Array.isArray(array) || !array.every(el => typeof el === 'string')) {
      throw Error(`Expected a JSON array of strings, got: ${rawInput}`);
    }
    return array;
  }
  return [rawInput];
}

function parseCheckMode(arg: string): CheckMode {
  arg = arg.toUpperCase();
  const matchingLevel = HLINT_SEV_LEVELS.find(sev => sev.toUpperCase() === arg);
  if (matchingLevel != null) {
    return matchingLevel;
  } else if (arg === 'STATUS' || arg === 'NEVER') {
    return arg;
  } else {
    return 'NEVER';
  }
}

const INPUT_KEY_HLINT_BIN = 'hlint-bin';
const INPUT_KEY_HLINT_FILES = 'path';
const INPUT_KEY_HLINT_FAIL_MODE = 'fail-on';

export default function getInputs(): RunArgs {
  const hlintCmd = core.getInput(INPUT_KEY_HLINT_BIN, {required: false}) || 'hlint';
  const pathList = parseStringOrJsonArray(core.getInput(INPUT_KEY_HLINT_FILES, {required: false}) || '.');
  const failOn = parseCheckMode(core.getInput(INPUT_KEY_HLINT_FAIL_MODE, {required: false}) || 'NEVER');

  // NOTE: Because ncc compiles all the files, take care that __dirname represents the dist/ folder.
  const baseDir = path.join(__dirname, '..');

  return {baseDir, hlintCmd, pathList, failOn};
}
