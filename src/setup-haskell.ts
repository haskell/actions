import * as core from '@actions/core';
import {findHaskellGHCVersion, findHaskellCabalVersion} from './installer';

// ghc and cabal are installed directly to /opt so use that directlly instead of
// copying over to the toolcache dir.
const baseInstallDir = '/opt';
const defaultGHCVersion = '8.6.5';
const defaultCabalVersion = '3.0';

async function run() {
  try {
    let ghcVersion = core.getInput('ghc-version');
    if (!ghcVersion) {
      ghcVersion = defaultGHCVersion;
    }
    findHaskellGHCVersion(baseInstallDir, ghcVersion);

    let cabalVersion = core.getInput('cabal-version');
    if (!cabalVersion) {
      cabalVersion = defaultCabalVersion;
    }
    findHaskellCabalVersion(baseInstallDir, cabalVersion);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
