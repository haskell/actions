"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCache = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const opts_1 = require("./opts");
const installer_1 = require("./installer");
const exec_1 = require("@actions/exec");
const c = __importStar(require("@actions/cache"));
const glob = __importStar(require("@actions/glob"));
const hashFiles_1 = __importDefault(require("./hashFiles"));
async function cabalConfig() {
    let out = Buffer.from('');
    const append = (b) => (out = Buffer.concat([out, b]));
    await exec_1.exec('cabal', ['--help'], {
        silent: true,
        listeners: { stdout: append, stderr: append }
    });
    return out.toString().trim().split('\n').slice(-1)[0].trim();
}
async function run(inputs) {
    try {
        core.info('Preparing to setup a Haskell environment');
        const os = process.platform;
        const home = process.env.HOME;
        const opts = opts_1.getOpts(opts_1.getDefaults(os), os, inputs);
        // Cache parameters
        let cachePaths = [];
        let hashFile = '';
        for (const [t, { resolved }] of Object.entries(opts).filter(o => o[1].enable))
            await core.group(`Installing ${t} version ${resolved}`, async () => installer_1.installTool(t, resolved, os));
        if (opts.stack.setup) {
            await core.group('Pre-installing GHC with stack', async () => exec_1.exec('stack', ['setup', opts.ghc.resolved]));
        }
        if (opts.stack.enable) {
            const stackRoot = os === 'win32' ? 'C:\\sr' : `${home}/.stack`;
            core.setOutput('stack-root', stackRoot);
            if (os === 'win32')
                core.exportVariable('STACK_ROOT', 'C:\\sr');
            if (opts.cache) {
                const matches = await glob
                    .create('**/stack.*.lock')
                    .then(async (g) => g.glob());
                if (!matches[0])
                    await exec_1.exec('stack', ['ls', 'dependencies']);
                cachePaths = [stackRoot];
                hashFile = matches[0] || 'stack.yaml.lock';
            }
        }
        if (opts.cabal.enable) {
            await core.group('Setting up cabal', async () => {
                await exec_1.exec('cabal', ['user-config', 'update'], { silent: true });
                const configFile = await cabalConfig();
                if (os === 'win32')
                    fs.appendFileSync(configFile, 'store-dir: C:\\sr\n');
                await exec_1.exec('cabal user-config update');
                if (!opts.stack.enable)
                    await exec_1.exec('cabal update');
            });
            const cabalStore = os === 'win32' ? 'C:\\sr' : `${home}/.cabal/store`;
            core.setOutput('cabal-store', cabalStore);
            if (opts.cache) {
                const matches = await glob
                    .create('**/cabal.*.freeze')
                    .then(async (g) => g.glob());
                if (!matches[0])
                    await exec_1.exec('cabal freeze');
                cachePaths = [cabalStore, 'dist-newstyle'];
                hashFile = matches[0] || 'cabal.project.freeze';
            }
        }
        if (opts.cache) {
            core.info(`Loading cache...`);
            const keys = [
                os,
                opts.ghc.resolved,
                await hashFiles_1.default(hashFile),
                process.env.GITHUB_SHA
            ];
            const st = {
                paths: opts.cachePaths || cachePaths,
                keys: opts.cacheKeys || [
                    keys.join('-'),
                    keys.slice(0, 4).join('-') + '-',
                    keys.slice(0, 3).join('-') + '-',
                    keys.slice(0, 2).join('-') + '-'
                ]
            };
            core.saveState('CACHE_STATE', st);
            const cacheHit = await c.restoreCache(st.paths, st.keys[0], st.keys.slice(1));
            core.info(`...${cacheHit ? 'done' : 'not found'}`);
            core.saveState('SAVE_CACHE', cacheHit && cacheHit !== st.keys[0]);
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
exports.default = run;
async function saveCache() {
    const st = JSON.parse(core.getState('CACHE_STATE'));
    const save = JSON.parse(core.getState('SAVE_CACHE'));
    if (save) {
        core.info('Saving cache...');
        try {
            await c.saveCache(st.paths, st.keys[0]);
            core.info('...done');
        }
        catch (err) {
            if (err.name === c.ReserveCacheError.name)
                core.info(`...${err.message}`);
            else
                throw err;
        }
    }
}
exports.saveCache = saveCache;
