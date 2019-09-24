import * as core from '@actions/core';
import {
  findHaskellGHCVersion,
  findHaskellCabalVersion,
  cacheHaskellTool
} from './installer';

const defaultGHCVersion = '8.6.5';
const defualtCabalVersion = '3.0';

async function run() {
  try {
    await cacheHaskellTool('/opt', 'ghc');
    await cacheHaskellTool('/opt', 'cabal');

    let ghcVersion = core.getInput('ghc-version');
    if (!ghcVersion) {
      ghcVersion = defaultGHCVersion;
    }
    await findHaskellGHCVersion(ghcVersion);

    let cabalVersion = core.getInput('cabal-version');
    if (!cabalVersion) {
      cabalVersion = defualtCabalVersion;
    }
    await findHaskellCabalVersion(cabalVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
