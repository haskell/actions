"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function cacheHaskellTool(installDir, tool) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseGHCDir = path.join(installDir, tool);
        const versions = fs.readdirSync(baseGHCDir);
        for (const v of versions) {
            const version = normalizeVersion(v);
            core.debug(`found ${tool} version: ${v} normalized to ${version}`);
            const dir = path.join(baseGHCDir, v);
            yield tc.cacheDir(dir, tool, version);
        }
    });
}
exports.cacheHaskellTool = cacheHaskellTool;
function findHaskellGHCVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        return _findHaskellToolVersion('ghc', version);
    });
}
exports.findHaskellGHCVersion = findHaskellGHCVersion;
function findHaskellCabalVersion(version) {
    return __awaiter(this, void 0, void 0, function* () {
        return _findHaskellToolVersion('cabal', version);
    });
}
exports.findHaskellCabalVersion = findHaskellCabalVersion;
function _findHaskellToolVersion(tool, version) {
    return __awaiter(this, void 0, void 0, function* () {
        version = normalizeVersion(version);
        const installDir = tc.find(tool, version);
        if (!installDir) {
            throw new Error(`Version ${version} of ${tool} not found`);
        }
        const toolPath = path.join(installDir, 'bin');
        core.addPath(toolPath);
    });
}
exports._findHaskellToolVersion = _findHaskellToolVersion;
// This function is required to convert the version 1.10 to 1.10.0.
// Because caching utility accept only sementic version,
// which have patch number as well.
function normalizeVersion(version) {
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
