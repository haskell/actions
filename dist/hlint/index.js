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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeProblem = exports.MATCHER_DEF_PATH = exports.MATCHER = exports.SEVERITY_LEVELS = void 0;
const path = __importStar(require("path"));
const github_1 = require("../github");
exports.SEVERITY_LEVELS = ['Error', 'Warning', 'Suggestion', 'Ignore'];
const HLINT_SEV_TO_GITHUB_SEV = {
    Error: 'error',
    Warning: 'warning',
    Suggestion: 'warning',
    Ignore: 'warning',
};
// Use JSON escaping to turn messages with newlines and such into a single line
function escapeString(str, quote) {
    const jsonEscaped = JSON.stringify(str).replace(/\n/g, ' ');
    // Possibly drop the surrounding quotes
    return quote ? jsonEscaped : jsonEscaped.slice(1, jsonEscaped.length - 1);
}
function getNiceMessage(hint) {
    const prefixParts = [];
    prefixParts.push(hint.severity);
    if (hint.decl && hint.decl.length) {
        prefixParts.push(`in ${hint.decl.join(', ')}`);
    }
    if (hint.module && hint.module.length) {
        prefixParts.push(`in module ${hint.module.join('.')}`);
    }
    const prefix = prefixParts.join(' ');
    const messageParts = [];
    messageParts.push();
    messageParts.push(hint.hint);
    if (hint.from) {
        messageParts.push(`Found: ${escapeString(hint.from, true)}`);
    }
    if (hint.to) {
        messageParts.push(`Perhaps: ${escapeString(hint.to, true)}`);
    }
    if (hint.note && hint.note.length) {
        messageParts.push(`Note: ${hint.note.map(n => escapeString(n, false)).join(' ')}`);
    }
    const message = messageParts.join(' ▫︎ ');
    return [prefix, message].filter(Boolean).join(': ');
}
function toMatchableProblem(hint) {
    const { file, startLine: line, startColumn: column, hint: code, severity: hlintSev } = hint;
    return {
        file,
        line,
        column,
        severity: HLINT_SEV_TO_GITHUB_SEV[hlintSev],
        code,
        message: getNiceMessage(hint),
    };
}
exports.MATCHER = new github_1.SingleLineMatcherFormat('hlint');
// NOTE: Because ncc compiles all the files, take not to use __dirname here.
// This path is relative to the repo root. (Possibly meaning cwd, but not necessarily).
exports.MATCHER_DEF_PATH = path.join('.github', 'hlint.json');
function serializeProblem(hint) {
    return exports.MATCHER.serialize(toMatchableProblem(hint));
}
exports.serializeProblem = serializeProblem;
