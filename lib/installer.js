"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function findHaskellGHCVersion(baseInstallDir, version) {
    return _findHaskellToolVersion(baseInstallDir, 'ghc', version);
}
exports.findHaskellGHCVersion = findHaskellGHCVersion;
function findHaskellCabalVersion(baseInstallDir, version) {
    return _findHaskellToolVersion(baseInstallDir, 'cabal', version);
}
exports.findHaskellCabalVersion = findHaskellCabalVersion;
function _findHaskellToolVersion(baseInstallDir, tool, version) {
    if (!baseInstallDir) {
        throw new Error('baseInstallDir parameter is required');
    }
    if (!tool) {
        throw new Error('toolName parameter is required');
    }
    if (!version) {
        throw new Error('versionSpec parameter is required');
    }
    const toolPath = path.join(baseInstallDir, tool, version, 'bin');
    if (fs.existsSync(toolPath)) {
        core.debug(`Found tool in cache ${tool} ${version}`);
        core.addPath(toolPath);
    }
    else {
        throw new Error(`Version ${version} of ${tool} not found`);
    }
}
exports._findHaskellToolVersion = _findHaskellToolVersion;
