import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';

export async function cacheHaskellTool(installDir: string, tool: string) {
  const baseGHCDir: string = path.join(installDir, tool);
  const versions: string[] = fs.readdirSync(baseGHCDir);
  for (const v of versions) {
    const version = normalizeVersion(v);
    core.debug(`found ${tool} version: ${v} normalized to ${version}`);
    const dir: string = path.join(baseGHCDir, v);
    await tc.cacheDir(dir, tool, version);
  }
}

export async function findHaskellGHCVersion(version: string) {
  if (!version) {
    version = '8.6.5';
  }
  return _findHaskellToolVersion('ghc', version);
}

export async function findHaskellCabalVersion(version: string) {
  if (!version) {
    version = '3.0';
  }
  return _findHaskellToolVersion('cabal', version);
}

export async function _findHaskellToolVersion(tool: string, version: string) {
  version = normalizeVersion(version);
  const installDir: string | null = tc.find(tool, version);
  if (!installDir) {
    throw new Error(`Version ${version} of ${tool} not found`);
  }

  const toolPath: string = path.join(installDir, 'bin');

  core.addPath(toolPath);
}

// This function is required to convert the version 1.10 to 1.10.0.
// Because caching utility accept only sementic version,
// which have patch number as well.
function normalizeVersion(version: string): string {
  const versionPart = version.split('.');
  if (versionPart[1] == null) {
    //append minor and patch version if not available
    return version.concat('.0.0');
  }
  if (versionPart[2] == null) {
    //append patch version if not available
    return version.concat('.0');
  }

  return version;
}
