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
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const hlint_1 = require("./hlint");
function parseStringOrJsonArray(rawInput) {
    if (/^\s*\[.*\]\s*$/.test(rawInput)) {
        const array = JSON.parse(rawInput);
        if (!Array.isArray(array) || !array.every(el => typeof el === 'string')) {
            throw Error(`Expected a JSON array of strings, got: ${rawInput}`);
        }
        return array;
    }
    return [rawInput];
}
function parseCheckMode(arg) {
    arg = arg.toUpperCase();
    const matchingLevel = hlint_1.SEVERITY_LEVELS.find(sev => sev.toUpperCase() === arg);
    if (matchingLevel != null) {
        return matchingLevel;
    }
    else if (arg === 'STATUS' || arg === 'NEVER') {
        return arg;
    }
    else {
        return 'NEVER';
    }
}
const INPUT_KEY_HLINT_BIN = 'hlint-bin';
const INPUT_KEY_HLINT_FILES = 'path';
const INPUT_KEY_HLINT_FAIL_MODE = 'fail-on';
function getInputs() {
    const hlintCmd = core.getInput(INPUT_KEY_HLINT_BIN, { required: false }) || 'hlint';
    const pathList = parseStringOrJsonArray(core.getInput(INPUT_KEY_HLINT_FILES, { required: false }) || '.');
    const failOn = parseCheckMode(core.getInput(INPUT_KEY_HLINT_FAIL_MODE, { required: false }) || 'NEVER');
    // NOTE: Because ncc compiles all the files, take care that __dirname represents the dist/ folder.
    const baseDir = path.join(__dirname, '..');
    return { baseDir, hlintCmd, pathList, failOn };
}
exports.default = getInputs;
