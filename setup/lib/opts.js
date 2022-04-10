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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpts = exports.getDefaults = exports.yamlInputs = exports.ghcup_version = exports.supported_versions = exports.release_revisions = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const sv = __importStar(require("./versions.json"));
const rv = __importStar(require("./release-revisions.json"));
exports.release_revisions = rv;
exports.supported_versions = sv;
exports.ghcup_version = sv.ghcup[0]; // Known to be an array of length 1
exports.yamlInputs = (0, js_yaml_1.load)((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'action.yml'), 'utf8')
// The action.yml file structure is statically known.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
).inputs;
function getDefaults(os) {
    const mkVersion = (v, vs, t) => ({
        version: resolve(exports.yamlInputs[v].default, vs, t, os),
        supported: vs
    });
    return {
        ghc: mkVersion('ghc-version', exports.supported_versions.ghc, 'ghc'),
        cabal: mkVersion('cabal-version', exports.supported_versions.cabal, 'cabal'),
        stack: mkVersion('stack-version', exports.supported_versions.stack, 'stack'),
        general: { matcher: { enable: true } }
    };
}
exports.getDefaults = getDefaults;
function resolve(version, supported, tool, os) {
    const resolved = version === 'latest'
        ? supported[0]
        : supported.find(v => v.startsWith(version)) ?? version;
    return (exports.release_revisions?.[os]?.[tool]?.find(({ from }) => from === resolved)?.to ??
        resolved);
}
function getOpts({ ghc, cabal, stack }, os, inputs) {
    core.debug(`Inputs are: ${JSON.stringify(inputs)}`);
    const stackNoGlobal = (inputs['stack-no-global'] || '') !== '';
    const stackSetupGhc = (inputs['stack-setup-ghc'] || '') !== '';
    const stackEnable = (inputs['enable-stack'] || '') !== '';
    const matcherDisable = (inputs['disable-matcher'] || '') !== '';
    core.debug(`${stackNoGlobal}/${stackSetupGhc}/${stackEnable}`);
    const verInpt = {
        ghc: inputs['ghc-version'] || ghc.version,
        cabal: inputs['cabal-version'] || cabal.version,
        stack: inputs['stack-version'] || stack.version
    };
    const errors = [];
    if (stackNoGlobal && !stackEnable) {
        errors.push('enable-stack is required if stack-no-global is set');
    }
    if (stackSetupGhc && !stackEnable) {
        errors.push('enable-stack is required if stack-setup-ghc is set');
    }
    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }
    const opts = {
        ghc: {
            raw: verInpt.ghc,
            resolved: resolve(verInpt.ghc, ghc.supported, 'ghc', os),
            enable: !stackNoGlobal
        },
        cabal: {
            raw: verInpt.cabal,
            resolved: resolve(verInpt.cabal, cabal.supported, 'cabal', os),
            enable: !stackNoGlobal
        },
        stack: {
            raw: verInpt.stack,
            resolved: resolve(verInpt.stack, stack.supported, 'stack', os),
            enable: stackEnable,
            setup: stackSetupGhc
        },
        general: { matcher: { enable: !matcherDisable } }
    };
    // eslint-disable-next-line github/array-foreach
    Object.values(opts)
        .filter(t => t.enable && t.raw !== t.resolved)
        .forEach(t => core.info(`Resolved ${t.raw} to ${t.resolved}`));
    core.debug(`Options are: ${JSON.stringify(opts)}`);
    return opts;
}
exports.getOpts = getOpts;
