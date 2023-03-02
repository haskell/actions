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
exports.getOpts = exports.parseURL = exports.parseYAMLBoolean = exports.releaseRevision = exports.getDefaults = exports.yamlInputs = exports.ghcup_version = exports.supported_versions = exports.release_revisions = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const path_1 = require("path");
const sv = __importStar(require("./versions.json"));
const rv = __importStar(require("./release-revisions.json"));
exports.release_revisions = rv;
exports.supported_versions = sv;
exports.ghcup_version = sv.ghcup[0]; // Known to be an array of length 1
/**
 * Reads the example `actions.yml` file and selects the `inputs` key. The result
 * will be a key-value map of the following shape:
 * ```
 * {
 *   'ghc-version': {
 *     required: false,
 *     description: '...',
 *     default: 'latest'
 *   },
 *   'cabal-version': {
 *     required: false,
 *     description: '...',
 *     default: 'latest'
 *   },
 *   'stack-version': {
 *     required: false,
 *     description: '...',
 *     default: 'latest'
 *   },
 *   'enable-stack': {
 *     required: false,
 *     default: 'latest'
 *   },
 *   ...
 * }
 * ```
 */
exports.yamlInputs = (0, js_yaml_1.load)((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'action.yml'), 'utf8')
// The action.yml file structure is statically known.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
).inputs;
function getDefaults(os) {
    const mkVersion = (v, vs, t) => ({
        version: resolve(exports.yamlInputs[v].default, vs, t, os, false),
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
// E.g. resolve ghc latest to 9.4.2
function resolve(version, supported, tool, os, verbose // If resolution isn't the identity, print what resolved to what.
) {
    const result = version === 'latest'
        ? supported[0]
        : supported.find(v => v.startsWith(version)) ?? version;
    // Andreas 2022-12-29, issue #144: inform about resolution here where we can also output ${tool}.
    if (verbose === true && version !== result)
        core.info(`Resolved ${tool} ${version} to ${result}`);
    return result;
}
// Further resolve the version to a revision using release-revisions.json.
// This is only needed for choco-installs (at time of writing, 2022-12-29).
function releaseRevision(version, tool, os) {
    const result = exports.release_revisions?.[os]?.[tool]?.find(({ from }) => from === version)?.to ??
        version;
    return result;
}
exports.releaseRevision = releaseRevision;
/**
 * Convert a string input to a boolean according to the YAML 1.2 "core schema" specification.
 * Supported boolean renderings: `true | True | TRUE | false | False | FALSE` .
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 * Adapted from: https://github.com/actions/toolkit/commit/fbdf27470cdcb52f16755d32082f1fee0bfb7d6d#diff-f63fb32fca85d8e177d6400ce078818a4815b80ac7a3319b60d3507354890992R94-R115
 *
 * @param     name     name of the input
 * @param     val      supposed string representation of a boolean
 * @returns   boolean
 */
function parseYAMLBoolean(name, val) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Action input "${name}" does not meet YAML 1.2 "Core Schema" specification: \n` +
        `Supported boolean values: \`true | True | TRUE | false | False | FALSE\``);
}
exports.parseYAMLBoolean = parseYAMLBoolean;
function parseURL(name, val) {
    if (val === '')
        return undefined;
    try {
        return new URL(val);
    }
    catch (e) {
        throw new TypeError(`Action input "${name}" is not a valid URL`);
    }
}
exports.parseURL = parseURL;
function getOpts({ ghc, cabal, stack }, os, inputs) {
    core.debug(`Inputs are: ${JSON.stringify(inputs)}`);
    const stackNoGlobal = (inputs['stack-no-global'] || '') !== '';
    const stackSetupGhc = (inputs['stack-setup-ghc'] || '') !== '';
    const stackEnable = (inputs['enable-stack'] || '') !== '';
    const matcherDisable = (inputs['disable-matcher'] || '') !== '';
    const ghcupReleaseChannel = parseURL('ghcup-release-channel', inputs['ghcup-release-channel'] || '');
    // Andreas, 2023-01-05, issue #29:
    // 'cabal-update' has a default value, so we should get a proper boolean always.
    // Andreas, 2023-01-06: This is not true if we use the action as a library.
    // Thus, need to patch with default value here.
    const cabalUpdate = parseYAMLBoolean('cabal-update', inputs['cabal-update'] || 'true');
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
    const ghcEnable = !stackNoGlobal;
    const cabalEnable = !stackNoGlobal;
    const opts = {
        ghc: {
            raw: verInpt.ghc,
            resolved: resolve(verInpt.ghc, ghc.supported, 'ghc', os, ghcEnable // if true: inform user about resolution
            ),
            enable: ghcEnable
        },
        ghcup: {
            releaseChannel: ghcupReleaseChannel
        },
        cabal: {
            raw: verInpt.cabal,
            resolved: resolve(verInpt.cabal, cabal.supported, 'cabal', os, cabalEnable // if true: inform user about resolution
            ),
            enable: cabalEnable,
            update: cabalUpdate
        },
        stack: {
            raw: verInpt.stack,
            resolved: resolve(verInpt.stack, stack.supported, 'stack', os, stackEnable // if true: inform user about resolution
            ),
            enable: stackEnable,
            setup: stackSetupGhc
        },
        general: { matcher: { enable: !matcherDisable } }
    };
    core.debug(`Options are: ${JSON.stringify(opts)}`);
    return opts;
}
exports.getOpts = getOpts;
