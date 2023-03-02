"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
const core = __importStar(require("@actions/core"));
const ensure_error_1 = __importDefault(require("ensure-error"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
const opts_1 = require("./opts");
const installer_1 = require("./installer");
const exec_1 = require("@actions/exec");
async function cabalConfig() {
    let out = Buffer.from('');
    const append = (b) => (out = Buffer.concat([out, b]));
    await (0, exec_1.exec)('cabal', ['--help'], {
        silent: true,
        listeners: { stdout: append, stderr: append }
    });
    return out.toString().trim().split('\n').slice(-1)[0].trim();
}
async function run(inputs) {
    try {
        core.info('Preparing to setup a Haskell environment');
        const os = process.platform;
        const opts = (0, opts_1.getOpts)((0, opts_1.getDefaults)(os), os, inputs);
        core.debug(`run: inputs = ${JSON.stringify(inputs)}`);
        core.debug(`run: os     = ${JSON.stringify(os)}`);
        core.debug(`run: opts   = ${JSON.stringify(opts)}`);
        if (opts.ghcup.releaseChannel) {
            await core.group(`Preparing ghcup environment`, async () => (0, installer_1.addGhcupReleaseChannel)(opts.ghcup.releaseChannel, os));
        }
        for (const [t, { resolved }] of Object.entries(opts).filter(o => o[1].enable)) {
            await core.group(`Preparing ${t} environment`, async () => (0, installer_1.resetTool)(t, resolved, os));
            await core.group(`Installing ${t} version ${resolved}`, async () => (0, installer_1.installTool)(t, resolved, os));
        }
        if (opts.stack.setup)
            await core.group('Pre-installing GHC with stack', async () => (0, exec_1.exec)('stack', ['setup', opts.ghc.resolved]));
        if (opts.cabal.enable)
            await core.group('Setting up cabal', async () => {
                // Create config only if it doesn't exist.
                await (0, exec_1.exec)('cabal', ['user-config', 'init'], {
                    silent: true,
                    ignoreReturnCode: true
                });
                // Blindly appending is fine.
                // Cabal merges these and picks the last defined option.
                const configFile = await cabalConfig();
                if (process.platform === 'win32') {
                    fs.appendFileSync(configFile, `store-dir: C:\\sr${os_1.EOL}`);
                    core.setOutput('cabal-store', 'C:\\sr');
                }
                else {
                    core.setOutput('cabal-store', `${process.env.HOME}/.cabal/store`);
                    // Issue #130: for non-choco installs, add ~/.cabal/bin to PATH
                    const installdir = `${process.env.HOME}/.cabal/bin`;
                    core.info(`Adding ${installdir} to PATH`);
                    core.addPath(installdir);
                }
                // Workaround the GHC nopie linking errors for ancient GHC versions
                // NB: Is this _just_ for GHC 7.10.3?
                if (opts.ghc.resolved === '7.10.3' && os !== 'win32') {
                    fs.appendFileSync(configFile, ['program-default-options', '  ghc-options: -optl-no-pie'].join(os_1.EOL) + os_1.EOL);
                    // We cannot use cabal user-config to normalize the config because of:
                    // https://github.com/haskell/cabal/issues/6823
                    // await exec('cabal user-config update');
                }
                if (opts.cabal.update && !opts.stack.enable)
                    await (0, exec_1.exec)('cabal update');
            });
        core.info(`##[add-matcher]${path.join(__dirname, '..', 'matcher.json')}`);
    }
    catch (_error) {
        const error = (0, ensure_error_1.default)(_error);
        if (core.isDebug()) {
            // we don't fail here so that the error path can be tested in CI
            core.setOutput('failed', true);
            core.debug(error.message);
        }
        else {
            core.setFailed(error.message);
        }
    }
}
exports.default = run;
