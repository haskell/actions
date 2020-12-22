import * as core from '@actions/core';
import * as fs from 'fs';
import {getOpts, getDefaults, Tool} from './opts';
import {installTool} from './installer';
import type {OS} from './opts';
import {exec} from '@actions/exec';
import * as c from '@actions/cache';
import * as glob from '@actions/glob';
import hashFiles from './hashFiles';

interface CacheState {
  paths: string[];
  keys: string[];
}

async function cabalConfig(): Promise<string> {
  let out = Buffer.from('');
  const append = (b: Buffer): Buffer => (out = Buffer.concat([out, b]));
  await exec('cabal', ['--help'], {
    silent: true,
    listeners: {stdout: append, stderr: append}
  });
  return out.toString().trim().split('\n').slice(-1)[0].trim();
}

export default async function run(
  inputs: Record<string, string>
): Promise<void> {
  try {
    core.info('Preparing to setup a Haskell environment');
    const os = process.platform as OS;
    const home = process.env.HOME;
    const opts = getOpts(getDefaults(os), os, inputs);

    // Cache parameters
    let cachePaths: string[] = [];
    let hashFile = '';

    for (const [t, {resolved}] of Object.entries(opts).filter(o => o[1].enable))
      await core.group(`Installing ${t} version ${resolved}`, async () =>
        installTool(t as Tool, resolved, os)
      );

    if (opts.stack.setup) {
      await core.group('Pre-installing GHC with stack', async () =>
        exec('stack', ['setup', opts.ghc.resolved])
      );
    }

    if (opts.stack.enable) {
      const stackRoot = os === 'win32' ? 'C:\\sr' : `${home}/.stack`;
      core.setOutput('stack-root', stackRoot);
      if (os === 'win32') core.exportVariable('STACK_ROOT', 'C:\\sr');

      if (opts.cache) {
        const matches = await glob
          .create('**/stack.*.lock')
          .then(async g => g.glob());
        if (!matches[0]) await exec('stack', ['ls', 'dependencies']);
        cachePaths = [stackRoot];
        hashFile = matches[0] || 'stack.yaml.lock';
      }
    }

    if (opts.cabal.enable) {
      await core.group('Setting up cabal', async () => {
        await exec('cabal', ['user-config', 'update'], {silent: true});
        const configFile = await cabalConfig();

        if (os === 'win32')
          fs.appendFileSync(configFile, 'store-dir: C:\\sr\n');

        await exec('cabal user-config update');
        if (!opts.stack.enable) await exec('cabal update');
      });
      const cabalStore = os === 'win32' ? 'C:\\sr' : `${home}/.cabal/store`;
      core.setOutput('cabal-store', cabalStore);

      if (opts.cache) {
        const matches = await glob
          .create('**/cabal.*.freeze')
          .then(async g => g.glob());
        if (!matches[0]) await exec('cabal freeze');
        cachePaths = [cabalStore, 'dist-newstyle'];
        hashFile = matches[0] || 'cabal.project.freeze';
      }
    }

    if (opts.cache) {
      core.info(`Loading cache...`);
      const keys = [
        os,
        opts.ghc.resolved,
        await hashFiles(hashFile),
        process.env.GITHUB_SHA
      ];
      const st: CacheState = {
        paths: opts.cachePaths || cachePaths,
        keys: opts.cacheKeys || [
          keys.join('-'),
          keys.slice(0, 4).join('-') + '-',
          keys.slice(0, 3).join('-') + '-',
          keys.slice(0, 2).join('-') + '-'
        ]
      };
      core.saveState('CACHE_STATE', st);
      const cacheHit = await c.restoreCache(
        st.paths,
        st.keys[0],
        st.keys.slice(1)
      );
      core.info(`...${cacheHit ? 'done' : 'not found'}`);
      core.saveState('SAVE_CACHE', cacheHit && cacheHit !== st.keys[0]);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

export async function saveCache(): Promise<void> {
  const st: CacheState = JSON.parse(core.getState('CACHE_STATE'));
  const save: boolean = JSON.parse(core.getState('SAVE_CACHE'));

  if (save) {
    core.info('Saving cache...');
    try {
      await c.saveCache(st.paths, st.keys[0]);
      core.info('...done');
    } catch (err) {
      if (err.name === c.ReserveCacheError.name) core.info(`...${err.message}`);
      else throw err;
    }
  }
}
