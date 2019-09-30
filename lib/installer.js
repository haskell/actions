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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function findHaskellGHCVersion(baseInstallDir, version) {
    return __awaiter(this, void 0, void 0, function* () {
        return _findHaskellToolVersion(baseInstallDir, 'ghc', version);
    });
}
exports.findHaskellGHCVersion = findHaskellGHCVersion;
function findHaskellCabalVersion(baseInstallDir, version) {
    return __awaiter(this, void 0, void 0, function* () {
        return _findHaskellToolVersion(baseInstallDir, 'cabal', version);
    });
}
exports.findHaskellCabalVersion = findHaskellCabalVersion;
function _findHaskellToolVersion(baseInstallDir, tool, version) {
    return __awaiter(this, void 0, void 0, function* () {
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
        if (fs.existsSync(toolPath) && fs.existsSync(`${toolPath}.complete`)) {
            core.debug(`Found tool in cache ${tool} ${version}`);
        }
        else {
            throw new Error(`Version ${version} of ${tool} not found`);
        }
        core.addPath(toolPath);
    });
}
exports._findHaskellToolVersion = _findHaskellToolVersion;
