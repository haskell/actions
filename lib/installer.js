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
const semver = __importStar(require("semver"));
function cacheHaskell(installDir, tool) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseGHCDir = path.join(installDir, tool);
        const versions = fs.readdirSync(baseGHCDir);
        for (const v of versions) {
            const version = semver.clean(v);
            if (!version) {
                continue;
            }
            core.debug(`found ${tool} version: ${version}`);
            const dir = path.join(baseGHCDir, version);
            yield tc.cacheDir(dir, tool, version);
        }
    });
}
exports.cacheHaskell = cacheHaskell;
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
        const installDir = tc.find(tool, version);
        if (!installDir) {
            throw new Error(`Version ${version} of ${tool} not found`);
        }
        const toolPath = path.join(installDir, 'bin');
        core.addPath(toolPath);
    });
}
exports._findHaskellToolVersion = _findHaskellToolVersion;
