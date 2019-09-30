import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

export async function findHaskellGHCVersion(
  baseInstallDir: string,
  version: string
) {
  return _findHaskellToolVersion(baseInstallDir, 'ghc', version);
}

export async function findHaskellCabalVersion(
  baseInstallDir: string,
  version: string
) {
  return _findHaskellToolVersion(baseInstallDir, 'cabal', version);
}

export async function _findHaskellToolVersion(
  baseInstallDir: string,
  tool: string,
  version: string
) {
  if (!baseInstallDir) {
    throw new Error('baseInstallDir parameter is required');
  }
  if (!tool) {
    throw new Error('toolName parameter is required');
  }
  if (!version) {
    throw new Error('versionSpec parameter is required');
  }

  const toolPath: string = path.join(baseInstallDir, tool, version, 'bin');
  if (fs.existsSync(toolPath)) {
    core.debug(`Found tool in cache ${tool} ${version}`);
    core.addPath(toolPath);
  } else {
    throw new Error(`Version ${version} of ${tool} not found`);
  }
}
