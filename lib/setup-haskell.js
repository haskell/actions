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
const installer_1 = require("./installer");
// ghc and cabal are installed directly to /opt so use that directlly instead of
// copying over to the toolcache dir.
const baseInstallDir = '/opt';
const defaultGHCVersion = '8.6.5';
const defaultCabalVersion = '3.0';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let ghcVersion = core.getInput('ghc-version');
            if (!ghcVersion) {
                ghcVersion = defaultGHCVersion;
            }
            installer_1.findHaskellGHCVersion(baseInstallDir, ghcVersion);
            let cabalVersion = core.getInput('cabal-version');
            if (!cabalVersion) {
                cabalVersion = defaultCabalVersion;
            }
            installer_1.findHaskellCabalVersion(baseInstallDir, cabalVersion);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
