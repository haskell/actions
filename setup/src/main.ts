import * as core from '@actions/core';
import {yamlInputs} from './opts';
import run from './setup-haskell';

run(
  Object.fromEntries(Object.keys(yamlInputs).map(k => [k, core.getInput(k)]))
);
