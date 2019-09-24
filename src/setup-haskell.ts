import * as core from '@actions/core';
import {
  findHaskellGHCVersion,
  findHaskellCabalVersion,
  cacheHaskellTool
} from './installer';

async function run() {
  try {
    await cacheHaskellTool('/opt', 'ghc');
    await cacheHaskellTool('/opt', 'cabal');
    let ghcVersion = core.getInput('ghc-version');
    await findHaskellGHCVersion(ghcVersion);

    let cabalVersion = core.getInput('cabal-version');
    await findHaskellCabalVersion(cabalVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
